import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu, RefreshCw } from "lucide-react";
import { useState } from "react";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { lockSite } from "@/lib/gate.functions";
import logo from "../assets/logo.png";

const NAV = [
  { to: "/", label: "Ringkasan" },
  { to: "/hotspot", label: "User Hotspot" },
  { to: "/graph", label: "Graph" },
  { to: "/perangkat", label: "Perangkat" },
] as const;

export function SiteHeader({
  onRefresh,
  isFetching,
}: {
  onRefresh: () => void;
  isFetching: boolean;
}) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const signOut = async () => {
    await lockSite();
    await navigate({ to: "/auth", replace: true });
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                aria-label="Buka menu"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-secondary md:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[82vw] max-w-xs p-0">
              <SheetHeader className="border-b border-border/70 px-5 py-4 text-left">
                <SheetTitle className="flex items-center gap-3">
                  <img
                    src={logo}
                    alt="Logo Griya Arca Putri"
                    className="h-9 w-auto object-contain"
                  />
                  <span className="font-display text-base font-semibold">
                    Griya <span className="text-gradient-brand">Arca Putri</span>
                  </span>
                </SheetTitle>
              </SheetHeader>

              <nav className="flex flex-col gap-1 p-3">
                {NAV.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    activeOptions={{ exact: item.to === "/" }}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
                    activeProps={{ className: "bg-primary/10 text-primary" }}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-auto flex flex-col gap-2 border-t border-border/70 p-3">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onRefresh();
                  }}
                  disabled={isFetching}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
                >
                  <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                  Perbarui data
                </button>
                                  <button
                    onClick={async () => {
                      setMenuOpen(false);
                      await signOut();
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
                  >
                    <LogOut className="h-4 w-4" /> Keluar
                  </button>
              </div>
            </SheetContent>
          </Sheet>

          <img
            src={logo}
            alt="Logo Griya Arca Putri"
            width={440}
            height={372}
            className="hidden h-10 w-auto object-contain sm:block sm:h-12"
          />
          <div className="min-w-0">
            <h1 className="truncate font-display text-base leading-tight font-semibold sm:text-lg">
              Griya <span className="text-gradient-brand">Arca Putri</span>
            </h1>
            <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
              Monitor Jaringan &amp; Perangkat
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isFetching}
            aria-label="Perbarui data"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-secondary disabled:opacity-60 sm:text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Perbarui</span>
          </button>
                      <button
              onClick={() => void signOut()}
              className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:bg-secondary md:inline-flex"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
        </div>
      </div>

      <nav className="mx-auto hidden max-w-6xl gap-1 px-2 pb-2 sm:px-5 md:flex">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === "/" }}
            className="rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-secondary"
            activeProps={{ className: "bg-primary/10 text-primary" }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
