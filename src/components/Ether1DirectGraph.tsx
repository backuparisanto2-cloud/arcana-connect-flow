import { ExternalLink, ImageOff, LineChart, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

const DIRECT_URL = "/api/mrtg/graphs/iface/ether1/daily.gif";

/**
 * Ringkasan grafik MRTG ether1 (harian) yang disematkan langsung dari URL
 * publik router. Diambil lewat reverse proxy HTTPS (/api/mrtg) agar tidak
 * terkena mixed content.
 */
export function Ether1DirectGraph({ refreshKey }: { refreshKey?: number }) {
  const [stamp, setStamp] = useState(() => Date.now());
  const [failed, setFailed] = useState(false);
  const [spinning, setSpinning] = useState(false);

  // Saat data router diperbarui, juga perbarui gambar.
  useEffect(() => {
    setStamp(Date.now());
    setFailed(false);
  }, [refreshKey]);

  // Segarkan gambar tiap 60 detik.
  useEffect(() => {
    const id = setInterval(() => setStamp(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const handleRefresh = () => {
    setSpinning(true);
    setFailed(false);
    setStamp(Date.now());
    window.setTimeout(() => setSpinning(false), 1200);
  };

  const src = `${DIRECT_URL}?t=${stamp}`;

  return (
    <section className="card-elevated mt-6 rounded-2xl border border-border p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-display text-base font-semibold">
          <LineChart className="h-4 w-4 text-primary" /> ether1 to Internet (Harian)
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
          >
            <RefreshCw className={`h-3 w-3 ${spinning ? "animate-spin" : ""}`} /> Segarkan
          </button>
          <span className="hidden text-xs text-muted-foreground sm:inline">MRTG · tiap 60 detik</span>
          {!failed && (
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
            >
              <ExternalLink className="h-3 w-3" /> Buka gambar penuh
            </a>
          )}
        </div>
      </div>

      {failed ? (
        <div className="mt-4 rounded-xl border border-dashed border-border p-5 text-center">
          <ImageOff className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            Gambar MRTG tidak dapat dimuat langsung di halaman ini.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Router MRTG mungkin sedang tidak dapat dijangkau dari server.
          </p>
          <a
            href={DIRECT_URL}
            target="_blank"
            rel="noreferrer"
            className="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
          >
            Buka di tab baru <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border/70 bg-card p-3">
          <img
            key={stamp}
            src={src}
            alt="Grafik trafik harian interface ether1"
            width={500}
            height={170}
            onError={() => setFailed(true)}
            style={{ imageRendering: "pixelated" }}
            className="mx-auto block h-[170px] w-[500px] max-w-none"
          />
        </div>
      )}
    </section>
  );
}
