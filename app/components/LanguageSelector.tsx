import type { LanguageCode } from "@/lib/ai";

type LanguageSelectorProps = {
  selectedLanguage: LanguageCode;
  options: Array<{ value: LanguageCode; label: string }>;
  onChange: (language: LanguageCode) => void;
  disabled?: boolean;
};

export function LanguageSelector({
  selectedLanguage,
  options,
  onChange,
  disabled = false,
}: LanguageSelectorProps) {
  return (
    <label className="flex min-w-0 flex-col gap-2 text-sm font-medium text-slate-700">
      Output language
      <select
        value={selectedLanguage}
        onChange={(event) => onChange(event.target.value as LanguageCode)}
        disabled={disabled}
        className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:cursor-not-allowed disabled:bg-slate-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
