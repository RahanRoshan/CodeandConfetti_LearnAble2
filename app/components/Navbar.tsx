"use client";

import { Moon, Sun } from "lucide-react";

type NavbarProps = {
  lowDataMode: boolean;
  theme: "light" | "dark";
  onToggleLowDataMode: () => void;
  onToggleTheme: () => void;
};

export function Navbar({
  lowDataMode,
  theme,
  onToggleLowDataMode,
  onToggleTheme,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/60 bg-white/75 backdrop-blur-xl transition-colors dark:border-slate-800/80 dark:bg-slate-950/75">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:flex-nowrap sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-950 text-lg font-semibold text-white shadow-[0_12px_26px_rgba(15,23,42,0.18)] dark:bg-teal-500 dark:text-slate-950 dark:shadow-[0_12px_26px_rgba(13,148,136,0.22)]">
            L
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-50">
              LearnAble
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Simplify, translate, listen, quiz
            </p>
          </div>
        </div>

        <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-pressed={theme === "dark"}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:text-white dark:focus:ring-offset-slate-950"
          >
            {theme === "dark" ? (
              <Sun className="size-4" aria-hidden="true" />
            ) : (
              <Moon className="size-4" aria-hidden="true" />
            )}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>

          <button
            type="button"
            onClick={onToggleLowDataMode}
            aria-pressed={lowDataMode}
            className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:text-white dark:focus:ring-offset-slate-950"
          >
            <span>Low Data Mode</span>
            <span
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                lowDataMode
                  ? "bg-teal-600"
                  : "bg-slate-300 dark:bg-slate-700"
              }`}
              aria-hidden="true"
            >
              <span
                className={`inline-block size-5 transform rounded-full bg-white shadow transition ${
                  lowDataMode ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
