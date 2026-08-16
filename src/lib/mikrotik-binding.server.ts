import { runRouterCommands } from "./mikrotik.server";

export type IpBinding = {
  macAddress: string | null;
  address: string | null;
  toAddress: string | null;
  type: string;
  disabled: boolean;
  comment: string | null;
};

export type IpBindingResult =
  | { ok: true; bindings: IpBinding[] }
  | { ok: false; error: string };

function clean(value: string | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Baca daftar IP-Binding hotspot dari router (termasuk comment). */
export async function fetchIpBindings(): Promise<IpBindingResult> {
  try {
    const [rows] = await runRouterCommands([{ command: "/ip/hotspot/ip-binding/print" }]);
    const bindings: IpBinding[] = (rows ?? []).map((r) => ({
      macAddress: clean(r["mac-address"])?.toUpperCase() ?? null,
      address: clean(r["address"]),
      toAddress: clean(r["to-address"]),
      type: clean(r["type"]) ?? "regular",
      disabled: r["disabled"] === "true",
      comment: clean(r["comment"]),
    }));
    return { ok: true, bindings };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan tidak dikenal";
    const unavailable = /no such (command|item)|not (allowed|permitted)|permission/i.test(message);
    return {
      ok: false,
      error: unavailable
        ? "IP-Binding hotspot tidak tersedia di router ini, atau user API tidak berhak membacanya."
        : message,
    };
  }
}
