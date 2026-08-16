import { runRouterCommands } from "./mikrotik.server";
import type { HotspotData, HotspotUser } from "./mikrotik-types";

function num(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function fetchHotspotData(): Promise<HotspotData> {
  const started = Date.now();
  try {
    const [rawUsers, rawActive] = await runRouterCommands([
      { command: "/ip/hotspot/user/print" },
      { command: "/ip/hotspot/active/print" },
    ]);

    const activeByUser = new Map<string, Record<string, string>>();
    for (const session of rawActive ?? []) {
      const name = session["user"];
      if (name) activeByUser.set(name, session);
    }

    const users: HotspotUser[] = (rawUsers ?? [])
      .filter((u) => u["default"] !== "true")
      .map((u) => {
        const name = u["name"] ?? "-";
        const session = activeByUser.get(name);
        return {
          name,
          profile: u["profile"] ?? "default",
          disabled: u["disabled"] === "true",
          online: session !== undefined,
          comment: u["comment"],
          totalBytesIn: num(u["bytes-in"]),
          totalBytesOut: num(u["bytes-out"]),
          totalUptime: u["uptime"] ?? "0s",
          address: session?.["address"],
          macAddress: session?.["mac-address"],
          sessionUptime: session?.["uptime"],
          idleTime: session?.["idle-time"],
          server: session?.["server"],
          sessionBytesIn: session ? num(session["bytes-in"]) : undefined,
          sessionBytesOut: session ? num(session["bytes-out"]) : undefined,
        };
      });

    // Sesi aktif tanpa akun terdaftar (mis. login via MAC/trial).
    const known = new Set(users.map((u) => u.name));
    for (const [name, session] of activeByUser) {
      if (known.has(name)) continue;
      users.push({
        name,
        profile: "(sesi tanpa akun)",
        disabled: false,
        online: true,
        totalBytesIn: num(session["bytes-in"]),
        totalBytesOut: num(session["bytes-out"]),
        totalUptime: session["uptime"] ?? "0s",
        address: session["address"],
        macAddress: session["mac-address"],
        sessionUptime: session["uptime"],
        idleTime: session["idle-time"],
        server: session["server"],
        sessionBytesIn: num(session["bytes-in"]),
        sessionBytesOut: num(session["bytes-out"]),
      });
    }

    users.sort((a, b) => {
      if (a.online !== b.online) return a.online ? -1 : 1;
      return a.name.localeCompare(b.name, "id");
    });

    const activeCount = users.filter((u) => u.online).length;

    return {
      ok: true,
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - started,
      users,
      activeCount,
      offlineCount: users.length - activeCount,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan tidak dikenal";
    const unavailable = /no such (command|item)|not (allowed|permitted)|permission/i.test(message);
    return {
      ok: false,
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - started,
      error: unavailable
        ? "Layanan hotspot tidak tersedia di router ini, atau user API tidak berhak membacanya."
        : message,
      unavailable,
    };
  }
}
