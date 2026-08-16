import { runRouterCommands } from "./mikrotik.server";
import type { RouterInterface, RouterStatus } from "./mikrotik-types";

const TRANSPORT = "RouterOS API (biner)";

function num(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function fetchRouterStatus(): Promise<RouterStatus> {
  const started = Date.now();
  try {
    const [resource, identity, routerboard, ifaces] = await runRouterCommands([
      { command: "/system/resource/print" },
      { command: "/system/identity/print" },
      { command: "/system/routerboard/print" },
      { command: "/interface/print" },
    ]);

    const r = resource?.[0] ?? {};
    const id = identity?.[0] ?? {};
    const rb = routerboard?.[0] ?? {};

    const interfaces: RouterInterface[] = (ifaces ?? []).map((i) => ({
      name: i["name"] ?? "-",
      type: i["type"] ?? "-",
      running: i["running"] === "true",
      disabled: i["disabled"] === "true",
      rxBytes: num(i["rx-byte"]),
      txBytes: num(i["tx-byte"]),
      comment: i["comment"],
    }));

    return {
      ok: true,
      latencyMs: Date.now() - started,
      checkedAt: new Date().toISOString(),
      transport: TRANSPORT,
      system: {
        identity: id["name"] ?? "-",
        boardName: r["board-name"] ?? "-",
        model: rb["model"] ?? r["board-name"] ?? "-",
        version: r["version"] ?? "-",
        buildTime: r["build-time"] ?? "-",
        uptime: r["uptime"] ?? "-",
        cpu: r["cpu"] ?? "-",
        cpuCount: r["cpu-count"] ?? "-",
        cpuLoad: num(r["cpu-load"]),
        freeMemory: num(r["free-memory"]),
        totalMemory: num(r["total-memory"]),
        freeHdd: num(r["free-hdd-space"]),
        totalHdd: num(r["total-hdd-space"]),
        architecture: r["architecture-name"] ?? "-",
        platform: r["platform"] ?? "-",
        serialNumber: rb["serial-number"] ?? "-",
      },
      interfaces,
    };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      checkedAt: new Date().toISOString(),
      transport: TRANSPORT,
      error: error instanceof Error ? error.message : "Terjadi kesalahan tidak dikenal",
    };
  }
}
