"use client";

import { Languages, LoaderCircle, Sparkles, WandSparkles } from "lucide-react";

import { LanguageSelector } from "@/app/components/LanguageSelector";
import type { LanguageCode } from "@/lib/ai";

type InputBoxProps = {
  value: string;
  selectedLanguage: LanguageCode;
  languageOptions: Array<{ value: LanguageCode; label: string }>;
  lowDataMode: boolean;
  isLoading: boolean;
  onChangeValue: (value: string) => void;
  onChangeLanguage: (language: LanguageCode) => void;
  onProcess: () => void;
  onExplainSimpler: () => void;
};

export function InputBox({
  value,
  selectedLanguage,
  languageOptions,
  lowDataMode,
  isLoading,
  onChangeValue,
  onChangeLanguage,
  onProcess,
  onExplainSimpler,
}: InputBoxProps) {
  const hasInput = value.trim().length > 0;

  return (
    <section className="rounded-[32px] border border-white/80 bg-white/88 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.09)] backdrop-blur-sm sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.15em] text-teal-700">
          <Sparkles className="size-4" aria-hidden="true" />
          Input
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          Works with mock AI when no API key is set
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <label htmlFor="lesson-input" className="text-sm font-medium text-slate-800">
          Paste educational content
        </label>
        <textarea
          id="lesson-input"
          value={value}
          onChange={(event) => onChangeValue(event.target.value)}
          placeholder="Paste a science, history, or textbook passage here. LearnAble will simplify it, translate it, and create a quick quiz."
          className="min-h-64 w-full resize-y rounded-[28px] border border-slate-200 bg-slate-50/70 px-5 py-4 text-base leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
        />
      </div>

      <div
        className={`mt-5 grid gap-4 ${
          lowDataMode
            ? "lg:grid-cols-1"
            : "lg:grid-cols-[minmax(220px,280px)_1fr]"
        }`}
      >
        <LanguageSelector
          selectedLanguage={selectedLanguage}
          options={languageOptions}
          onChange={onChangeLanguage}
          disabled={isLoading}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-end">
          <button
            type="button"
            onClick={onExplainSimpler}
            disabled={!hasInput || isLoading}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
          >
            <WandSparkles className="size-4" aria-hidden="true" />
            Explain Simpler
          </button>
          <button
            type="button"
            onClick={onProcess}
            disabled={!hasInput || isLoading}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white shadow-[0_14px_32px_rgba(15,23,42,0.22)] transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isLoading ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Languages className="size-4" aria-hidden="true" />
            )}
            Process Content
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>{value.trim().split(/\s+/).filter(Boolean).length} words ready to process.</p>
        <p>
          Language changes refresh the current result automatically after the
          first run.
        </p>
      </div>
    </section>
  );
}
