import { createFileRoute } from "@tanstack/react-router";

/**
 * Reverse proxy MRTG.
 *
 * Router hanya menyajikan MRTG lewat HTTP (port 2627), sedangkan aplikasi
 * berjalan di HTTPS — sehingga embed langsung diblokir browser (mixed content).
 * Rute ini meneruskan permintaan ke MRTG dari sisi server, jadi browser cukup
 * memanggil origin HTTPS yang sama: /api/mrtg/<path>.
 */
const UPSTREAMS = ["http://117.121.207.223:2627", "http://192.168.35.1"];

const PROXY_PREFIX = "/api/mrtg";

function isHtml(contentType: string) {
  return contentType.toLowerCase().includes("text/html");
}

/** Tulis ulang URL absolut ke upstream agar tetap lewat proxy (untuk iframe). */
function rewriteHtml(html: string) {
  let out = html;
  for (const base of UPSTREAMS) {
    out = out.split(base).join(PROXY_PREFIX);
  }
  // href="/graphs/..." atau src='/graphs/...' -> lewat proxy
  out = out.replace(/(href|src|action)=("|')\/(?!\/)/gi, `$1=$2${PROXY_PREFIX}/`);
  return out;
}

async function proxy(base: string, path: string, search: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${base}/${path}${search}`, {
      signal: controller.signal,
      redirect: "follow",
    });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "application/octet-stream";
    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
      // izinkan ditampilkan dalam iframe di origin sendiri
      "Content-Security-Policy": "frame-ancestors 'self'",
    };

    if (isHtml(contentType)) {
      return new Response(rewriteHtml(await res.text()), { status: 200, headers });
    }

    const buf = await res.arrayBuffer();
    if (buf.byteLength === 0) return null;
    return new Response(buf, { status: 200, headers });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export const Route = createFileRoute("/api/mrtg/$")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const path = (params._splat ?? "").replace(/^\/+/, "");
        const search = new URL(request.url).search;
        // Cegah penyalahgunaan: hanya path MRTG.
        if (path && !path.startsWith("graphs")) {
          return new Response("Not found", { status: 404 });
        }
        for (let attempt = 0; attempt < 2; attempt++) {
          for (const base of UPSTREAMS) {
            const res = await proxy(base, path, search);
            if (res) return res;
          }
        }
        return new Response("MRTG tidak dapat dijangkau", {
          status: 502,
          headers: { "Cache-Control": "no-store" },
        });
      },
    },
  },
});
