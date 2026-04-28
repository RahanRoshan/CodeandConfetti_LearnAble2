"use client";

import { useEffect, useRef, useState } from "react";
import { PauseCircle, PlayCircle, Volume2 } from "lucide-react";

type AudioPlayerProps = {
  text: string;
  language: string;
  isSpeaking: boolean;
  setIsSpeaking: (value: boolean) => void;
};

export function AudioPlayer({
  text,
  language,
  isSpeaking,
  setIsSpeaking,
}: AudioPlayerProps) {
  const [statusMessage, setStatusMessage] = useState("");
  const isCancellingRef = useRef(false);
  const isSupported =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window;

  useEffect(() => {
    if (!isSupported) {
      return;
    }

    isCancellingRef.current = true;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported, language, setIsSpeaking, text]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        isCancellingRef.current = true;
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function pickVoice() {
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find((voice) =>
        voice.lang.toLowerCase().startsWith(language.toLowerCase()),
      ) ||
      voices.find((voice) =>
        voice.lang.toLowerCase().startsWith(language.slice(0, 2).toLowerCase()),
      ) ||
      null
    );
  }

  function handlePlay() {
    if (!isSupported || !text.trim()) {
      return;
    }

    window.speechSynthesis.cancel();
    isCancellingRef.current = false;

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();

    utterance.lang = language;
    if (voice) {
      utterance.voice = voice;
      setStatusMessage("");
    } else if (language !== "en-US") {
      setStatusMessage(
        "A matching voice was not found, so the browser will use its default voice.",
      );
    } else {
      setStatusMessage("");
    }

    utterance.onend = () => {
      isCancellingRef.current = false;
      setIsSpeaking(false);
    };
    utterance.onerror = () => {
      if (isCancellingRef.current) {
        isCancellingRef.current = false;
        setIsSpeaking(false);
        return;
      }
      setStatusMessage("Audio playback stopped unexpectedly.");
      setIsSpeaking(false);
    };

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  function handleStop() {
    if (!isSupported) {
      return;
    }

    isCancellingRef.current = true;
    window.speechSynthesis.cancel();
    setStatusMessage("");
    setIsSpeaking(false);
  }

  return (
    <section className="flex h-full flex-col rounded-[28px] border border-white/80 bg-white/88 p-6 shadow-[0_18px_54px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-slate-950">
            Audio player
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Listen to the current output with your browser&apos;s speech engine.
          </p>
        </div>
        <Volume2 className="mt-1 size-5 text-teal-700" aria-hidden="true" />
      </div>

      <div className="mt-6 flex flex-1 flex-col justify-between rounded-[24px] bg-slate-50 px-5 py-4">
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-600">Playback language</p>
          <p className="text-base font-semibold text-slate-900">{language}</p>
          <p className="text-sm leading-6 text-slate-500">
            {isSupported
              ? "Play reads the simplified English version or the translated language selection."
              : "This browser does not expose speech synthesis, so audio is unavailable here."}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handlePlay}
            disabled={!isSupported || !text.trim() || isSpeaking}
            className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <PlayCircle className="size-4" aria-hidden="true" />
            Play
          </button>
          <button
            type="button"
            onClick={handleStop}
            disabled={!isSupported || !isSpeaking}
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            <PauseCircle className="size-4" aria-hidden="true" />
            Stop
          </button>
        </div>
      </div>

      <p className="mt-3 min-h-5 text-sm text-slate-500">{statusMessage}</p>
    </section>
  );
}
