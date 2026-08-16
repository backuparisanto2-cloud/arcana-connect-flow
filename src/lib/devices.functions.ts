import { createServerFn } from "@tanstack/react-start";

import type { DeviceInput } from "./devices-types";
import { normalizeDeviceInput } from "./devices-types";

export const DEVICE_IMAGE_BUCKET = "device-images";

export const listDevices = createServerFn({ method: "GET" }).handler(async () => {
  const { requireUnlocked } = await import("./gate.server");
  await requireUnlocked();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("devices")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const saveDevice = createServerFn({ method: "POST" })
  .inputValidator((input: DeviceInput & { id?: string }) => ({
    id: input.id ? String(input.id) : null,
    values: normalizeDeviceInput(input),
  }))
  .handler(async ({ data }) => {
    const { requireUnlocked } = await import("./gate.server");
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.id) {
      const { error } = await supabaseAdmin
        .from("devices")
        .update(data.values)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("devices").insert(data.values);
      if (error) throw new Error(error.message);
    }
    return { ok: true as const };
  });

export const deleteDevice = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => ({ id: String(input.id) }))
  .handler(async ({ data }) => {
    const { requireUnlocked } = await import("./gate.server");
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("devices").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** URL unggah bertanda tangan agar browser bisa mengirim file tanpa akses publik. */
export const createDeviceImageUpload = createServerFn({ method: "POST" })
  .inputValidator((input: { ext: string }) => ({
    ext: /^[a-z0-9]{2,5}$/i.test(input.ext) ? input.ext.toLowerCase() : "webp",
  }))
  .handler(async ({ data }) => {
    const { requireUnlocked } = await import("./gate.server");
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const path = `${crypto.randomUUID()}.${data.ext}`;
    const { data: signed, error } = await supabaseAdmin.storage
      .from(DEVICE_IMAGE_BUCKET)
      .createSignedUploadUrl(path);
    if (error || !signed) throw new Error(error?.message ?? "Gagal menyiapkan unggahan.");
    return { path, token: signed.token };
  });

export const getDeviceImageSignedUrl = createServerFn({ method: "POST" })
  .inputValidator((input: { path: string }) => ({ path: String(input.path) }))
  .handler(async ({ data }) => {
    const { requireUnlocked } = await import("./gate.server");
    await requireUnlocked();
    if (/^https?:\/\//.test(data.path)) return { url: data.path };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from(DEVICE_IMAGE_BUCKET)
      .createSignedUrl(data.path, 60 * 60);
    if (error || !signed) return { url: null };
    return { url: signed.signedUrl };
  });

/** Sinkronisasi daftar IP-Binding hotspot MikroTik ke tabel perangkat. */
export const syncDevicesFromBindings = createServerFn({ method: "POST" }).handler(async () => {
  const { requireUnlocked } = await import("./gate.server");
  await requireUnlocked();

  const { fetchIpBindings } = await import("./mikrotik-binding.server");
  const result = await fetchIpBindings();
  if (!result.ok) return { ok: false as const, error: result.error, created: 0, skipped: 0 };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: existing, error: readError } = await supabaseAdmin
    .from("devices")
    .select("id, name, mac_address, ip_address, notes");
  if (readError) return { ok: false as const, error: readError.message, created: 0, skipped: 0 };

  const keyOf = (mac: string, ip: string | null) => `${mac.trim().toUpperCase()}|${ip ?? ""}`;
  const seen = new Set<string>();
  for (const d of existing ?? []) {
    if (d.mac_address) seen.add(keyOf(d.mac_address, d.ip_address ?? null));
  }

  const MARK = "Sumber: IP-Binding MikroTik";
  let created = 0;
  let skipped = 0;

  for (const b of result.bindings) {
    if (!b.macAddress) continue;
    const ip = b.address ?? b.toAddress ?? null;
    const key = keyOf(b.macAddress, ip);
    if (seen.has(key)) {
      skipped += 1;
      continue;
    }
    seen.add(key);

    const { error } = await supabaseAdmin.from("devices").insert({
      name: b.comment ?? b.macAddress,
      device_type: "Lainnya",
      mac_address: b.macAddress,
      ip_address: ip,
      notes: `${MARK} · tipe ${b.type} · ${b.disabled ? "nonaktif" : "aktif"}`,
    });
    if (error) skipped += 1;
    else created += 1;
  }

  return { ok: true as const, created, skipped };
});

