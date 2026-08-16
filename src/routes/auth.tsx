import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LockKeyhole } from "lucide-react";

import { unlockSite } from "@/lib/gate.functions";
import logo from "../assets/logo.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Masuk — Griya Arca Putri" },
      {
        name: "description",
        content: "Halaman masuk pengelola jaringan Griya Arca Putri.",
      },
      { property: "og:title", content: "Masuk — Griya Arca Putri" },
      { property: "og:description", content: "Masuk untuk membuka monitor jaringan kost." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { ok } = await unlockSite({ data: { username, password } });
      if (!ok) {
        setError("Username atau password salah.");
        return;
      }
      await navigate({ to: "/", replace: true });
    } catch {
      setError("Gagal masuk, coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <img src={logo} alt="Logo Griya Arca Putri" className="h-16 w-auto object-contain" />
          <h1 className="mt-4 font-display text-xl font-semibold">
            Griya <span className="text-gradient-brand">Arca Putri</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Masuk untuk membuka monitor jaringan.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="card-elevated mt-6 space-y-4 rounded-2xl border border-border p-5"
        >
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            <LockKeyhole className="h-4 w-4" />
            {loading ? "Memeriksa…" : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
