import { createServerFn } from "@tanstack/react-start";
import { fetchRouterStatus } from "./mikrotik-status.server";
import { fetchHotspotData } from "./mikrotik-hotspot.server";

export const getRouterStatus = createServerFn({ method: "GET" }).handler(async () => {
  return fetchRouterStatus();
});

export const getHotspotUsers = createServerFn({ method: "GET" }).handler(async () => {
  return fetchHotspotData();
});
