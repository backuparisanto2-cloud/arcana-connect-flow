import { createFileRoute } from "@tanstack/react-router";

const SOURCES = [
  "http://117.121.207.223:2627/graphs/iface/ether1/daily.gif",
  "http://192.168.35.1/graphs/iface/ether1/daily.gif",
];

async function fetchGraph(url: string): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength === 0) return null;
    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "image/gif",
        "Cache-Control": "no-store",
        "X-Graph-Source": url,
      },
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const PLACEHOLDER = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="170" viewBox="0 0 500 170">
  <rect width="500" height="170" fill="#0f172a"/>
  <text x="250" y="88" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" fill="#94a3b8">Grafik MRTG belum tersedia — mencoba lagi otomatis</text>
</svg>`;

export const Route = createFileRoute("/api/graph/ether1.gif")({
  server: {
    handlers: {
      GET: async () => {
        // Dua percobaan per sumber: router kadang menolak koneksi sesaat.
        for (let attempt = 0; attempt < 2; attempt++) {
          for (const url of SOURCES) {
            const res = await fetchGraph(url);
            if (res) return res;
          }
        }
        // Jangan balas 502 (memicu error boundary); kirim placeholder.
        return new Response(PLACEHOLDER, {
          status: 200,
          headers: {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "no-store",
            "X-Graph-Source": "placeholder",
          },
        });
      },
    },
  },
});
