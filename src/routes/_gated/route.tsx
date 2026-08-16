import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { gateStatus } from "@/lib/gate.functions";

export const Route = createFileRoute("/_gated")({
  beforeLoad: async () => {
    const { unlocked } = await gateStatus();
    if (!unlocked) throw redirect({ to: "/auth" });
  },
  component: () => <Outlet />,
});
