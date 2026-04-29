"use client";

import { useState, useSyncExternalStore } from "react";
import { AlertCircle, LoaderCircle, Sparkles } from "lucide-react";

import { AudioPlayer } from "@/app/components/AudioPlayer";
import { InputBox } from "@/app/components/InputBox";
import { Navbar } from "@/app/components/Navbar";
import { OutputCard } from "@/app/components/OutputCard";
import { Quiz } from "@/app/components/Quiz";
import type { LanguageCode, ProcessResponse } from "@/lib/ai";

const LANGUAGE_OPTIONS: Array<{ value: LanguageCode; label: string }> = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "kn", label: "Kannada" },
];

const EMPTY_COPY_STATUS = {
  simplified: "",
  translated: "",
};
const THEME_STORAGE_KEY = "learnable-theme";
const THEME_CHANGE_EVENT = "learnable-theme-change";

function resolveThemePreference(): "light" | "dark" {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getThemeSnapshot(): "light" | "dark" {
  if (typeof document === "undefined") {
    return "light";
  }

  return document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
}

function subscribeToTheme(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleThemeChange = () => onStoreChange();
  const handleSystemChange = () => {
    if (!window.localStorage.getItem(THEME_STORAGE_KEY)) {
      const nextTheme = mediaQuery.matches ? "dark" : "light";
      document.documentElement.classList.toggle("dark", nextTheme === "dark");
      window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
    }
  };
  const handleStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) {
      document.documentElement.classList.toggle(
        "dark",
        resolveThemePreference() === "dark",
      );
      onStoreChange();
    }
  };

  window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
  window.addEventListener("storage", handleStorage);
  mediaQuery.addEventListener("change", handleSystemChange);

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    window.removeEventListener("storage", handleStorage);
    mediaQuery.removeEventListener("change", handleSystemChange);
  };
}

function applyTheme(nextTheme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", nextTheme === "dark");
  window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export default function Home() {
  const [sourceText, setSourceText] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>("en");
  const [lowDataMode, setLowDataMode] = useState(false);
  const [simplerPass, setSimplerPass] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ProcessResponse | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [copyStatus, setCopyStatus] = useState(EMPTY_COPY_STATUS);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const theme = useSyncExternalStore<"light" | "dark">(
    subscribeToTheme,
    getThemeSnapshot,
    () => "light",
  );

  async function runProcess(options?: {
    nextSimplerPass?: number;
    language?: LanguageCode;
  }) {
    const trimmed = sourceText.trim();
    if (!trimmed) {
      setError(
        "Paste some educational text first so LearnAble has something to work with.",
      );
      setResult(null);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setIsSpeaking(false);
      return;
    }

    const nextPass = options?.nextSimplerPass ?? 0;
    const requestLanguage = options?.language ?? selectedLanguage;

    setError("");
    setIsLoading(true);
    setIsSpeaking(false);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setCopyStatus(EMPTY_COPY_STATUS);

    try {
      const response = await fetch("/api/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: trimmed,
          language: requestLanguage,
          simplerPass: nextPass,
        }),
      });

      const payload = (await response.json()) as
        | ProcessResponse
        | { error?: string };

      if (!response.ok || !("simplifiedText" in payload)) {
        const errorMessage =
          "error" in payload ? payload.error : undefined;
        throw new Error(
          errorMessage || "LearnAble could not process that text right now.",
        );
      }

      setSimplerPass(nextPass);
      setSelectedLanguage(requestLanguage);
      setResult(payload);
    } catch (processingError) {
      setResult(null);
      setError(
        processingError instanceof Error
          ? processingError.message
          : "Something went wrong while processing your content.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleSelectAnswer(questionId: string, answerIndex: number) {
    setQuizAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: answerIndex,
    }));
  }

  function handleChangeLanguage(language: LanguageCode) {
    setSelectedLanguage(language);

    if (result && !isLoading && language !== selectedLanguage) {
      void runProcess({ nextSimplerPass: simplerPass, language });
    }
  }

  async function handleCopy(kind: keyof typeof EMPTY_COPY_STATUS, text: string) {
    if (!navigator.clipboard) {
      setCopyStatus((currentStatus) => ({
        ...currentStatus,
        [kind]: "Clipboard is not available in this browser.",
      }));
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus((currentStatus) => ({
        ...currentStatus,
        [kind]: "Copied.",
      }));
      window.setTimeout(() => {
        setCopyStatus((currentStatus) => ({
          ...currentStatus,
          [kind]: "",
        }));
      }, 1800);
    } catch {
      setCopyStatus((currentStatus) => ({
        ...currentStatus,
        [kind]: "Copy failed. Try again.",
      }));
    }
  }

  const audioText =
    selectedLanguage === "en"
      ? result?.simplifiedText ?? ""
      : result?.translatedText ?? "";
  const audioLanguage =
    selectedLanguage === "hi"
      ? "hi-IN"
      : selectedLanguage === "kn"
        ? "kn-IN"
        : "en-US";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_34%),linear-gradient(180deg,#f7fbfc_0%,#eef5f6_100%)] text-slate-900 transition-colors dark:bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.14),transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_52%,#111827_100%)] dark:text-slate-100">
      <Navbar
        lowDataMode={lowDataMode}
        theme={theme}
        onToggleLowDataMode={() => setLowDataMode((currentMode) => !currentMode)}
        onToggleTheme={() => applyTheme(theme === "dark" ? "light" : "dark")}
      />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-14 pt-8 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-start">
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-teal-700">
                Learn better, faster
              </p>
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-50 sm:text-5xl">
                Turn dense lessons into simple text, translation, audio, and a quick quiz.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
                Paste educational content, pick a language, and let LearnAble
                reshape it into a lighter study session.
              </p>
            </div>

            <InputBox
              value={sourceText}
              selectedLanguage={selectedLanguage}
              languageOptions={LANGUAGE_OPTIONS}
              lowDataMode={lowDataMode}
              isLoading={isLoading}
              onChangeValue={setSourceText}
              onChangeLanguage={handleChangeLanguage}
              onProcess={() => void runProcess({ nextSimplerPass: 0 })}
              onExplainSimpler={() =>
                void runProcess({ nextSimplerPass: simplerPass + 1 })
              }
            />
          </div>

          <aside className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm transition-colors dark:border-slate-800/80 dark:bg-slate-900/78 dark:shadow-[0_20px_60px_rgba(2,8,23,0.42)] sm:p-6">
            <div className="flex items-center gap-3 text-teal-700">
              <Sparkles className="size-5" aria-hidden="true" />
              <p className="text-sm font-semibold tracking-[0.14em] uppercase">
                Study flow
              </p>
            </div>
            <div className="mt-5 space-y-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
              <p>
                LearnAble keeps the original lesson intact, then rebuilds it
                into a simpler explanation and a translated companion version.
              </p>
              <p>
                The second button makes the explanation even lighter without
                losing your original source text.
              </p>
              <p>
                Low Data Mode trims the page down to the core reading and
                listening tools for lighter connections and smaller screens.
              </p>
            </div>
            <div className="mt-6 grid gap-3 rounded-3xl bg-slate-950 p-4 text-sm text-white dark:bg-slate-950/90">
              <div className="flex items-center justify-between">
                <span className="text-white/70">Active language</span>
                <span>
                  {
                    LANGUAGE_OPTIONS.find(
                      (item) => item.value === selectedLanguage,
                    )?.label
                  }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Simpler passes</span>
                <span>{simplerPass}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Current mode</span>
                <span>{lowDataMode ? "Low data" : "Full study"}</span>
              </div>
            </div>
          </aside>
        </section>

        {error ? (
          <div className="flex items-start gap-3 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/50 dark:text-rose-200">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>{error}</p>
          </div>
        ) : null}

        {isLoading ? (
          <section className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: lowDataMode ? 3 : 4 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] dark:border-slate-800/80 dark:bg-slate-900/85 dark:shadow-[0_18px_48px_rgba(2,8,23,0.42)]"
              >
                <div className="h-5 w-32 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="mt-5 space-y-3">
                  <div className="h-4 w-full animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-11/12 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-4/5 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </section>
        ) : null}

        {result ? (
          <section className="space-y-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                  Your learning set
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {result.usedMock
                    ? "Mock AI mode is active because LearnAble could not complete a live OpenAI request."
                    : "Generated with OpenAI."}
                </p>
              </div>
              {isLoading ? (
                <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                  <LoaderCircle
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                  Refreshing content
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <OutputCard
                title="Text"
                description={`Pass ${simplerPass + 1} explanation for the original lesson.`}
                content={result.simplifiedText}
                copyMessage={copyStatus.simplified}
                onCopy={() => void handleCopy("simplified", result.simplifiedText)}
              />

              <OutputCard
                title="Translated text"
                description={`Rendered in ${LANGUAGE_OPTIONS.find((item) => item.value === selectedLanguage)?.label}.`}
                content={result.translatedText}
                copyMessage={copyStatus.translated}
                onCopy={() => void handleCopy("translated", result.translatedText)}
              />

              <AudioPlayer
                text={audioText}
                language={audioLanguage}
                isSpeaking={isSpeaking}
                setIsSpeaking={setIsSpeaking}
              />

              {!lowDataMode ? (
                <Quiz
                  questions={result.quiz}
                  answers={quizAnswers}
                  submitted={quizSubmitted}
                  onSelectAnswer={handleSelectAnswer}
                  onSubmit={() => setQuizSubmitted(true)}
                />
              ) : null}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
