import { createServerFn } from "@tanstack/react-start";

export const gateStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { isUnlocked } = await import("./gate.server");
  return { unlocked: await isUnlocked() };
});

export const unlockSite = createServerFn({ method: "POST" })
  .inputValidator((input: { username: string; password: string }) => ({
    username: String(input.username ?? ""),
    password: String(input.password ?? ""),
  }))
  .handler(async ({ data }) => {
    const { credentialsMatch, getGateSession } = await import("./gate.server");
    if (!credentialsMatch(data.username, data.password)) {
      return { ok: false as const };
    }
    const session = await getGateSession();
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

export const lockSite = createServerFn({ method: "POST" }).handler(async () => {
  const { getGateSession } = await import("./gate.server");
  const session = await getGateSession();
  await session.clear();
  return { ok: true as const };
});
