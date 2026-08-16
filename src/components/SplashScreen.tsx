import { useEffect, useState } from "react";

import logo from "../assets/logo.png";

/**
 * Splash screen hi-tech sederhana dengan logo aplikasi, tampil sekali saat dibuka.
 */
export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.sessionStorage.getItem("splash-shown")) {
      setVisible(false);
      return;
    }
    const fade = setTimeout(() => setFading(true), 1200);
    const hide = setTimeout(() => {
      setVisible(false);
      try {
        window.sessionStorage.setItem("splash-shown", "1");
      } catch {
        /* ignore */
      }
    }, 1700);
    return () => {
      clearTimeout(fade);
      clearTimeout(hide);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="relative flex h-36 w-36 items-center justify-center">
        <svg
          viewBox="0 0 120 120"
          className="absolute inset-0 h-full w-full text-primary"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="60" cy="60" r="56" className="opacity-20" />
          <circle
            cx="60"
            cy="60"
            r="56"
            strokeDasharray="60 290"
            strokeLinecap="round"
            className="origin-center animate-spin [animation-duration:1.4s]"
          />
          <circle cx="60" cy="60" r="46" className="opacity-25" />
        </svg>
        <img
          src={logo}
          alt="Logo Griya Arca Putri"
          className="h-20 w-20 object-contain drop-shadow-sm"
        />
      </div>

      <p className="mt-6 font-display text-lg font-semibold tracking-wide">
        Griya <span className="text-gradient-brand">Arca Putri</span>
      </p>
      <p className="mt-1 text-xs tracking-[0.2em] text-muted-foreground uppercase">
        Network Monitor
      </p>

      <div className="mt-6 h-1 w-40 overflow-hidden rounded-full bg-secondary">
        <div className="h-full w-1/3 animate-[splash-bar_1.2s_ease-in-out_infinite] rounded-full bg-primary" />
      </div>
    </div>
  );
}
