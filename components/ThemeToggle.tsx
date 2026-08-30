"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("vin-theme");
    const isDark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", isDark);
    setDark(isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("vin-theme", next ? "dark" : "light");
  }

  return (
    <button onClick={toggle} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-white/70 transition hover:-translate-y-0.5 dark:bg-white/5" style={{ borderColor: "var(--border)" }}>
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}