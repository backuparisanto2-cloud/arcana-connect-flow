import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Search, TriangleAlert, Users, Wifi, WifiOff } from "lucide-react";

import { SiteHeader } from "@/components/SiteHeader";
import { getHotspotUsers } from "@/lib/mikrotik.functions";
import { formatBytes, formatUptime } from "@/lib/mikrotik-types";

export const Route = createFileRoute("/_gated/hotspot")({
  head: () => ({
    meta: [
      { title: "User Hotspot — Griya Arca Putri" },
      {
        name: "description",
        content:
          "Daftar user hotspot Griya Arca Putri beserta status aktif dan tidak aktif, profil, dan pemakaian data.",
      },
      { property: "og:title", content: "User Hotspot — Griya Arca Putri" },
      {
        property: "og:description",
        content: "Pantau siapa saja yang sedang online di jaringan hotspot Griya Arca Putri.",
      },
    ],
  }),
  component: HotspotPage,
});

type Filter = "all" | "online" | "offline";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "online", label: "Aktif" },
  { key: "offline", label: "Tidak aktif" },
];

function HotspotPage() {
  const fetchHotspot = useServerFn(getHotspotUsers);
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["hotspot-users"],
    queryFn: () => fetchHotspot(),
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const users = data?.ok ? data.users : [];
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (filter === "online" && !u.online) return false;
      if (filter === "offline" && u.online) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.profile.toLowerCase().includes(q) ||
        (u.address ?? "").toLowerCase().includes(q) ||
        (u.macAddress ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, query, filter]);

  return (
    <div className="min-h-screen">
      <SiteHeader onRefresh={() => void refetch()} isFetching={isFetching} />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold sm:text-2xl">User Hotspot</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Daftar akun hotspot beserta status sesi. Pembaruan otomatis tiap 60 detik.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {data
              ? `Cek terakhir ${new Date(data.checkedAt).toLocaleTimeString("id-ID", { hour12: false })}`
              : "Memuat…"}
          </p>
        </div>

        {data && !data.ok ? (
          <section className="card-elevated mt-6 rounded-2xl border border-destructive/25 p-6">
            <h3 className="flex items-center gap-2 font-display text-base font-semibold text-destructive">
              <TriangleAlert className="h-4 w-4" /> Data hotspot tidak bisa dibaca
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{data.error}</p>
          </section>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-3 gap-3 sm:gap-4">
              <SummaryCard
                label="Total user"
                value={data?.ok ? users.length : "—"}
                icon={<Users className="h-4 w-4" />}
              />
              <SummaryCard
                label="Sedang aktif"
                value={data?.ok ? data.activeCount : "—"}
                tone="success"
                icon={<Wifi className="h-4 w-4" />}
              />
              <SummaryCard
                label="Tidak aktif"
                value={data?.ok ? data.offlineCount : "—"}
                tone="muted"
                icon={<WifiOff className="h-4 w-4" />}
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="relative min-w-[200px] flex-1">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari nama user, profil, IP, atau MAC…"
                  aria-label="Cari user hotspot"
                  className="w-full rounded-full border border-border bg-card py-2.5 pr-4 pl-9 text-sm shadow-sm outline-none focus:border-primary/60"
                />
              </div>
              <div className="flex gap-1 rounded-full border border-border bg-card p-1 shadow-sm">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
                      filter === f.key
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <section className="card-elevated mt-5 rounded-2xl border border-border p-4 sm:p-5">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="text-left text-xs tracking-wide text-muted-foreground uppercase">
                      <th className="pb-2 font-medium">User</th>
                      <th className="pb-2 font-medium">Profil</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">IP / MAC</th>
                      <th className="pb-2 font-medium">Lama sesi</th>
                      <th className="pb-2 text-right font-medium">Unduh</th>
                      <th className="pb-2 text-right font-medium">Unggah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((u) => (
                      <tr key={u.name} className="border-t border-border/60">
                        <td className="py-2.5 font-medium">{u.name}</td>
                        <td className="py-2.5 text-muted-foreground">{u.profile}</td>
                        <td className="py-2.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                              u.disabled
                                ? "bg-secondary text-muted-foreground"
                                : u.online
                                  ? "bg-success/12 text-success"
                                  : "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {u.online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                            {u.disabled ? "Dinonaktifkan" : u.online ? "Aktif" : "Tidak aktif"}
                          </span>
                        </td>
                        <td className="py-2.5 text-xs text-muted-foreground">
                          {u.online ? (
                            <>
                              <span className="block tabular-nums">{u.address ?? "-"}</span>
                              <span className="block tabular-nums">{u.macAddress ?? "-"}</span>
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-2.5 tabular-nums">
                          {u.online ? formatUptime(u.sessionUptime ?? "") : formatUptime(u.totalUptime)}
                          {!u.online && (
                            <span className="block text-xs text-muted-foreground">total</span>
                          )}
                        </td>
                        <td className="py-2.5 text-right tabular-nums">
                          {formatBytes(u.online ? (u.sessionBytesIn ?? 0) : u.totalBytesIn)}
                        </td>
                        <td className="py-2.5 text-right tabular-nums">
                          {formatBytes(u.online ? (u.sessionBytesOut ?? 0) : u.totalBytesOut)}
                        </td>
                      </tr>
                    ))}
                    {visible.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                          {data ? "Tidak ada user yang cocok." : "Memuat data user hotspot…"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        <footer className="mt-10 pb-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Griya Arca Putri · Dashboard jaringan internal
        </footer>
      </main>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  tone = "primary",
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  tone?: "primary" | "success" | "muted";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "muted"
        ? "text-muted-foreground"
        : "text-primary";
  return (
    <div className="card-elevated rounded-2xl border border-border p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
        <span className={toneClass}>{icon}</span>
      </div>
      <p className="animate-value mt-2 font-display text-xl font-semibold sm:text-2xl">{value}</p>
    </div>
  );
}
