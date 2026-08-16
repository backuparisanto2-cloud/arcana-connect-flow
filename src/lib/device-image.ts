import { supabase } from "@/integrations/supabase/client";
import {
  DEVICE_IMAGE_BUCKET,
  createDeviceImageUpload,
  getDeviceImageSignedUrl,
} from "./devices.functions";

export { DEVICE_IMAGE_BUCKET };
const MAX_BYTES = 300 * 1024;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gagal membaca gambar."));
    };
    img.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/webp", quality));
}

/** Kompres gambar jadi WebP maksimal 300 KB. */
export async function compressToWebp(file: File): Promise<Blob> {
  const img = await loadImage(file);
  let maxSide = 1280;

  for (let attempt = 0; attempt < 6; attempt++) {
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Browser tidak mendukung kompresi gambar.");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.8, 0.65, 0.5, 0.35]) {
      const blob = await toBlob(canvas, quality);
      if (blob && blob.size <= MAX_BYTES) return blob;
    }
    maxSide = Math.round(maxSide * 0.75);
  }
  throw new Error("Gambar terlalu besar, coba foto lain.");
}

export async function uploadDeviceImage(file: File): Promise<string> {
  const blob = await compressToWebp(file);
  const { path, token } = await createDeviceImageUpload({ data: { ext: "webp" } });
  const { error } = await supabase.storage
    .from(DEVICE_IMAGE_BUCKET)
    .uploadToSignedUrl(path, token, blob, { contentType: "image/webp" });
  if (error) throw new Error(error.message);
  return path;
}

export async function getDeviceImageUrl(path: string): Promise<string | null> {
  if (/^https?:\/\//.test(path)) return path;
  const { url } = await getDeviceImageSignedUrl({ data: { path } });
  return url;
}
