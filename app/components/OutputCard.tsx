"use client";

import { Check, Copy } from "lucide-react";

type OutputCardProps = {
  title: string;
  description: string;
  content: string;
  copyMessage: string;
  onCopy: () => void;
};

export function OutputCard({
  title,
  description,
  content,
  copyMessage,
  onCopy,
}: OutputCardProps) {
  return (
    <article className="flex h-full flex-col rounded-[28px] border border-white/80 bg-white/88 p-6 shadow-[0_18px_54px_rgba(15,23,42,0.08)] transition-colors dark:border-slate-800/80 dark:bg-slate-900/88 dark:shadow-[0_18px_54px_rgba(2,8,23,0.38)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:text-white dark:focus:ring-offset-slate-900"
        >
          {copyMessage === "Copied." ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
          Copy
        </button>
      </div>

      <div className="mt-6 flex-1 rounded-[24px] bg-slate-50 px-5 py-4 dark:bg-slate-950">
        <p className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700 dark:text-slate-200">
          {content}
        </p>
      </div>

      <p className="mt-3 min-h-5 text-sm text-slate-500 dark:text-slate-400">
        {copyMessage}
      </p>
    </article>
  );
}
