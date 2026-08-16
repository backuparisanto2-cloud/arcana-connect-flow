import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Globe2, Wifi } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/_gated/graph")({
  head: () => ({
    meta: [
      { title: "Graph Trafik Router — Griya Arca Putri" },
      {
        name: "description",
        content:
          "Akses grafik trafik MikroTik Griya Arca Putri dari luar kost maupun dari jaringan lokal kost.",
      },
      { property: "og:title", content: "Graph Trafik Router — Griya Arca Putri" },
      {
        property: "og:description",
        content: "Tautan cepat ke grafik trafik router MikroTik kost Griya Arca Putri.",
      },
    ],
  }),
  component: GraphPage,
});

const LINKS = [
  {
    title: "Dari luar kost",
    url: "http://117.121.207.223:2627/graphs/",
    description:
      "Gunakan saat Anda sedang tidak terhubung ke WiFi kost (pakai data seluler atau jaringan lain).",
    icon: Globe2,
  },
  {
    title: "Dari dalam kost",
    url: "http://192.168.35.1/graphs/",
    description:
      "Alamat lokal router. Hanya bisa dibuka bila perangkat Anda terhubung ke jaringan WiFi/LAN kost.",
    icon: Wifi,
  },
] as const;

function GraphPage() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader
        isFetching={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          void queryClient.invalidateQueries().finally(() => setRefreshing(false));
        }}
      />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <h2 className="font-display text-xl font-semibold sm:text-2xl">Graph Trafik Router</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Grafik disajikan langsung oleh MikroTik dan terbuka di tab baru.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {LINKS.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <link.icon className="h-5 w-5" />
                </span>
                <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
              </div>
              <h3 className="mt-4 font-display text-base font-semibold">{link.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{link.description}</p>
              <p className="mt-3 truncate rounded-lg bg-secondary px-3 py-2 font-mono text-xs text-foreground">
                {link.url}
              </p>
            </a>
          ))}
        </div>

        <p className="mt-6 rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
          Catatan: grafik router memakai koneksi HTTP biasa sehingga tidak bisa ditampilkan
          menyatu di halaman ini (diblokir browser). Karena itu tautannya dibuka di tab baru.
        </p>
      </main>
    </div>
  );
}
