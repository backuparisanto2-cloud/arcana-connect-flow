import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

export type GateSession = { unlocked?: boolean };

function sessionConfig() {
  return {
    password: process.env["SESSION_SECRET"]!,
    name: "griya-gate",
    maxAge: 60 * 60 * 24 * 7,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

export async function getGateSession() {
  return useSession<GateSession>(sessionConfig());
}

export async function isUnlocked(): Promise<boolean> {
  const session = await getGateSession();
  return session.data.unlocked === true;
}

/** Lempar error bila belum masuk. Dipakai di server function terlindungi. */
export async function requireUnlocked() {
  if (!(await isUnlocked())) throw new Error("Belum masuk.");
}

function digest(value: string) {
  return createHash("sha256").update(value, "utf8").digest();
}

export function credentialsMatch(username: string, password: string): boolean {
  const expectedUser = process.env["SITE_USERNAME"] ?? "";
  const expectedPass = process.env["SITE_PASSWORD"] ?? "";
  if (!expectedUser || !expectedPass) return false;
  const userOk = timingSafeEqual(
    digest(username.trim().toLowerCase()),
    digest(expectedUser.trim().toLowerCase()),
  );
  const passOk = timingSafeEqual(digest(password), digest(expectedPass));
  return userOk && passOk;
}
