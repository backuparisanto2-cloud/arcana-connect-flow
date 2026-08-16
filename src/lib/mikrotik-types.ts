export type RouterInterface = {
  name: string;
  type: string;
  running: boolean;
  disabled: boolean;
  rxBytes: number;
  txBytes: number;
  comment?: string | undefined;
};

export type RouterSystem = {
  identity: string;
  boardName: string;
  model: string;
  version: string;
  buildTime: string;
  uptime: string;
  cpu: string;
  cpuCount: string;
  cpuLoad: number;
  freeMemory: number;
  totalMemory: number;
  freeHdd: number;
  totalHdd: number;
  architecture: string;
  platform: string;
  serialNumber: string;
};

export type RouterStatusOk = {
  ok: true;
  latencyMs: number;
  checkedAt: string;
  transport: string;
  system: RouterSystem;
  interfaces: RouterInterface[];
};

export type RouterStatusError = {
  ok: false;
  latencyMs: number;
  checkedAt: string;
  transport: string;
  error: string;
};

export type RouterStatus = RouterStatusOk | RouterStatusError;

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

const UPTIME_UNITS: Record<string, string> = {
  w: "mgg",
  d: "hari",
  h: "jam",
  m: "mnt",
  s: "dtk",
};

export function formatUptime(uptime: string): string {
  if (!uptime) return "-";
  const parts = [...uptime.matchAll(/(\d+)([wdhms])/g)].map(
    (m) => `${m[1]} ${UPTIME_UNITS[m[2] as string] ?? m[2]}`,
  );
  if (parts.length === 0) return uptime;
  return parts.slice(0, 3).join(" ");
}

export type HotspotUser = {
  name: string;
  profile: string;
  disabled: boolean;
  online: boolean;
  comment?: string | undefined;
  /** Total akumulasi pemakaian akun (dari router). */
  totalBytesIn: number;
  totalBytesOut: number;
  totalUptime: string;
  /** Data sesi aktif, hanya ada bila online. */
  address?: string | undefined;
  macAddress?: string | undefined;
  sessionUptime?: string | undefined;
  idleTime?: string | undefined;
  server?: string | undefined;
  sessionBytesIn?: number | undefined;
  sessionBytesOut?: number | undefined;
};

export type HotspotDataOk = {
  ok: true;
  checkedAt: string;
  latencyMs: number;
  users: HotspotUser[];
  activeCount: number;
  offlineCount: number;
};

export type HotspotDataError = {
  ok: false;
  checkedAt: string;
  latencyMs: number;
  error: string;
  /** true bila router tidak memiliki layanan hotspot / user API tidak berhak. */
  unavailable?: boolean;
};

export type HotspotData = HotspotDataOk | HotspotDataError;
