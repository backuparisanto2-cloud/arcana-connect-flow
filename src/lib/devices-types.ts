export const DEVICE_TYPES = [
  "Access Point",
  "Router",
  "Switch",
  "CCTV",
  "IP-CAM",
  "NVR",
  "ONT/Modem",
  "Lainnya",
] as const;


export type DeviceType = (typeof DEVICE_TYPES)[number];

export type Device = {
  id: string;
  name: string;
  device_type: string;
  location: string | null;
  serial_number: string | null;
  image_url: string | null;
  ip_address: string | null;
  mac_address: string | null;
  username: string | null;
  password: string | null;
  ssid: string | null;
  wifi_password: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type DeviceInput = {
  name: string;
  device_type: string;
  location?: string | null;
  serial_number?: string | null;
  image_url?: string | null;
  ip_address?: string | null;
  mac_address?: string | null;
  username?: string | null;
  password?: string | null;
  ssid?: string | null;
  wifi_password?: string | null;
  notes?: string | null;
};

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeDeviceInput(input: DeviceInput) {
  const name = clean(input.name);
  if (!name) throw new Error("Nama perangkat wajib diisi.");
  const type = clean(input.device_type) ?? "Lainnya";
  return {
    name,
    device_type: type,
    location: clean(input.location),
    serial_number: clean(input.serial_number),
    image_url: clean(input.image_url),
    ip_address: clean(input.ip_address),
    mac_address: clean(input.mac_address),
    username: clean(input.username),
    password: clean(input.password),
    ssid: clean(input.ssid),
    wifi_password: clean(input.wifi_password),
    notes: clean(input.notes),
  };
}

export const EMPTY_DEVICE: DeviceInput = {
  name: "",
  device_type: "Access Point",
  location: "",
  serial_number: "",
  image_url: "",
  ip_address: "",
  mac_address: "",
  username: "",
  password: "",
  ssid: "",
  wifi_password: "",
  notes: "",
};
