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
  if (!result.ok) return { ok: false as const, error: result.error, created: 0, updated: 0 };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: existing, error: readError } = await supabaseAdmin
    .from("devices")
    .select("id, name, mac_address, ip_address, notes");
  if (readError) return { ok: false as const, error: readError.message, created: 0, updated: 0 };

  const byMac = new Map<string, (typeof existing)[number]>();
  for (const d of existing ?? []) {
    const mac = d.mac_address?.trim().toUpperCase();
    if (mac) byMac.set(mac, d);
  }

  const MARK = "Sumber: IP-Binding MikroTik";
  let created = 0;
  let updated = 0;

  for (const b of result.bindings) {
    if (!b.macAddress) continue;
    const ip = b.address ?? b.toAddress ?? null;
    const notes = `${MARK} · tipe ${b.type} · ${b.disabled ? "nonaktif" : "aktif"}`;
    const name = b.comment ?? b.macAddress;
    const current = byMac.get(b.macAddress);

    if (!current) {
      const { error } = await supabaseAdmin.from("devices").insert({
        name,
        device_type: "Lainnya",
        mac_address: b.macAddress,
        ip_address: ip,
        notes,
      });
      if (!error) created += 1;
      continue;
    }

    const fromImport = (current.notes ?? "").includes(MARK);
    const patch: { ip_address: string | null; notes: string; name?: string } = {
      ip_address: ip,
      notes,
    };
    if (fromImport && b.comment) patch.name = name;
    const changed =
      current.ip_address !== patch.ip_address ||
      current.notes !== patch.notes ||
      (patch.name !== undefined && current.name !== patch.name);
    if (!changed) continue;
    const { error } = await supabaseAdmin.from("devices").update(patch).eq("id", current.id);
    if (!error) updated += 1;
  }

  return { ok: true as const, created, updated };
});
