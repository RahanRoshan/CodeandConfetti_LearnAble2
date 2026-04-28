"use client";

type NavbarProps = {
  lowDataMode: boolean;
  onToggleLowDataMode: () => void;
};

export function Navbar({
  lowDataMode,
  onToggleLowDataMode,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/60 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-950 text-lg font-semibold text-white shadow-[0_12px_26px_rgba(15,23,42,0.18)]">
            L
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight text-slate-950">
              LearnAble
            </p>
            <p className="text-sm text-slate-500">
              Simplify, translate, listen, quiz
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleLowDataMode}
          aria-pressed={lowDataMode}
          className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        >
          <span>Low Data Mode</span>
          <span
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
              lowDataMode ? "bg-teal-600" : "bg-slate-300"
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
    </header>
  );
}
