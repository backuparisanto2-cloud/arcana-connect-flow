import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  Router as RouterIcon,
  ShieldCheck,
  Timer,
  TriangleAlert,
} from "lucide-react";

import { SiteHeader } from "@/components/SiteHeader";
import { Ether1DirectGraph } from "@/components/Ether1DirectGraph";
import { StatCard, UsageBar } from "@/components/StatCard";
import { getRouterStatus } from "@/lib/mikrotik.functions";
import { formatBytes, formatUptime } from "@/lib/mikrotik-types";


export const Route = createFileRoute("/_gated/")({
  head: () => ({
    meta: [
      { title: "Griya Arca Putri — Monitor Jaringan Router" },
      {
        name: "description",
        content:
          "Dashboard status router MikroTik Griya Arca Putri: uptime, beban CPU, memori, dan trafik interface secara real time.",
      },
      { property: "og:title", content: "Griya Arca Putri — Monitor Jaringan Router" },
      {
        property: "og:description",
        content:
          "Pantau status koneksi, sumber daya, dan interface router MikroTik Griya Arca Putri dari mana saja.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const fetchStatus = useServerFn(getRouterStatus);
  const { data, isFetching, refetch, error } = useQuery({
    queryKey: ["router-status"],
    queryFn: () => fetchStatus(),
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const status = data;
  const online = status?.ok === true;

  return (
    <div className="min-h-screen">
      <SiteHeader onRefresh={() => void refetch()} isFetching={isFetching} />


      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <section
          className="card-elevated rounded-3xl border border-border p-5 sm:p-7"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                  online ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive"
                }`}
              >
                {online ? <ShieldCheck className="h-6 w-6" /> : <TriangleAlert className="h-6 w-6" />}
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold sm:text-xl">
                  {status === undefined
                    ? "Menghubungkan ke router…"
                    : online
                      ? "Router Terhubung"
                      : "Router Tidak Terjangkau"}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {status === undefined
                    ? "Mengambil data dari perangkat MikroTik."
                    : online
                      ? `${status.system.identity} · RouterOS ${status.system.version}`
                      : (status?.error ?? "Gagal memuat status")}
                </p>
              </div>
            </div>
            <dl className="flex gap-6">
              <div>
                <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">
                  Latensi
                </dt>
                <dd className="font-display text-lg font-semibold">
                  {status ? `${status.latencyMs} ms` : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">
                  Cek terakhir
                </dt>
                <dd className="font-display text-lg font-semibold">
                  {status
                    ? new Date(status.checkedAt).toLocaleTimeString("id-ID", { hour12: false })
                    : "—"}
                </dd>
              </div>
            </dl>
          </div>

          <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
            Transport: {status?.transport ?? "RouterOS API (biner)"} · Pembaruan otomatis tiap 60
            detik
            {error ? " · Terjadi gangguan pada server aplikasi" : ""}
          </p>
        </section>

        <Ether1Graph refreshKey={status?.checkedAt ? new Date(status.checkedAt).getTime() : 0} />



        {online && status.ok ? (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <StatCard
                label="Uptime"
                value={formatUptime(status.system.uptime)}
                icon={<Timer className="h-4 w-4" />}
              />
              <StatCard
                label="Beban CPU"
                value={`${status.system.cpuLoad}%`}
                hint={`${status.system.cpu} · ${status.system.cpuCount} core`}
                icon={<Cpu className="h-4 w-4" />}
              />
              <div className="card-elevated rounded-2xl border border-border p-4 sm:p-5">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Memori
                  </p>
                  <MemoryStick className="h-4 w-4 text-primary/70" />
                </div>
                <p className="animate-value mt-2 font-display text-xl font-semibold sm:text-2xl">
                  {formatBytes(status.system.totalMemory - status.system.freeMemory)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  dari {formatBytes(status.system.totalMemory)}
                </p>
                <UsageBar
                  used={status.system.totalMemory - status.system.freeMemory}
                  total={status.system.totalMemory}
                />
              </div>
              <div className="card-elevated rounded-2xl border border-border p-4 sm:p-5">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Penyimpanan
                  </p>
                  <HardDrive className="h-4 w-4 text-primary/70" />
                </div>
                <p className="animate-value mt-2 font-display text-xl font-semibold sm:text-2xl">
                  {formatBytes(status.system.totalHdd - status.system.freeHdd)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  dari {formatBytes(status.system.totalHdd)}
                </p>
                <UsageBar
                  used={status.system.totalHdd - status.system.freeHdd}
                  total={status.system.totalHdd}
                />
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <section className="card-elevated rounded-2xl border border-border p-5">
                <h3 className="flex items-center gap-2 font-display text-base font-semibold">
                  <RouterIcon className="h-4 w-4 text-primary" /> Perangkat
                </h3>
                <dl className="mt-4 space-y-3 text-sm">
                  {[
                    ["Identitas", status.system.identity],
                    ["Model", status.system.model],
                    ["Board", status.system.boardName],
                    ["Arsitektur", status.system.architecture],
                    ["Platform", status.system.platform],
                    ["RouterOS", status.system.version],
                    ["Build", status.system.buildTime],
                    ["Serial", status.system.serialNumber],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 border-b border-border/60 pb-2 last:border-0">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="text-right font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="card-elevated rounded-2xl border border-border p-5 lg:col-span-2">
                <h3 className="flex items-center gap-2 font-display text-base font-semibold">
                  <Network className="h-4 w-4 text-primary" /> Interface ({status.interfaces.length})
                </h3>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[420px] text-sm">
                    <thead>
                      <tr className="text-left text-xs tracking-wide text-muted-foreground uppercase">
                        <th className="pb-2 font-medium">Nama</th>
                        <th className="pb-2 font-medium">Tipe</th>
                        <th className="pb-2 text-right font-medium">RX</th>
                        <th className="pb-2 text-right font-medium">TX</th>
                        <th className="pb-2 text-right font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {status.interfaces.map((i) => (
                        <tr key={i.name} className="border-t border-border/60">
                          <td className="py-2.5 font-medium">
                            {i.comment ? (
                              <span className="mb-0.5 block text-[11px] leading-tight font-normal text-primary">
                                {i.comment}
                              </span>
                            ) : null}
                            {i.name}
                          </td>

                          <td className="py-2.5 text-muted-foreground">{i.type}</td>
                          <td className="py-2.5 text-right tabular-nums">{formatBytes(i.rxBytes)}</td>
                          <td className="py-2.5 text-right tabular-nums">{formatBytes(i.txBytes)}</td>
                          <td className="py-2.5 text-right">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                                i.disabled
                                  ? "bg-secondary text-muted-foreground"
                                  : i.running
                                    ? "bg-success/12 text-success"
                                    : "bg-warning/15 text-warning-foreground"
                              }`}
                            >
                              <Activity className="h-3 w-3" />
                              {i.disabled ? "Nonaktif" : i.running ? "Aktif" : "Down"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </>
        ) : status && !status.ok ? (
          <section className="card-elevated mt-6 rounded-2xl border border-destructive/25 p-6">
            <h3 className="font-display text-base font-semibold text-destructive">
              Diagnostik koneksi
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{status.error}</p>
            <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
              <li>Pastikan service API di router aktif dan port tidak diblokir firewall.</li>
              <li>Periksa daftar <em>allowed address</em> pada user API agar server ini diizinkan.</li>
              <li>Pastikan user dan password API masih valid.</li>
            </ul>
          </section>
        ) : null}

        <footer className="mt-10 pb-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Griya Arca Putri · Dashboard jaringan internal
        </footer>
      </main>
    </div>
  );
}
