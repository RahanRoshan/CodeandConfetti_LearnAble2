"use client";

import type { QuizQuestion } from "@/lib/ai";

type QuizProps = {
  questions: QuizQuestion[];
  answers: Record<string, number>;
  submitted: boolean;
  onSelectAnswer: (questionId: string, answerIndex: number) => void;
  onSubmit: () => void;
};

export function Quiz({
  questions,
  answers,
  submitted,
  onSelectAnswer,
  onSubmit,
}: QuizProps) {
  const answeredCount = questions.filter(
    (question) => answers[question.id] !== undefined,
  ).length;
  const score = questions.reduce((total, question) => {
    return total + (answers[question.id] === question.correctIndex ? 1 : 0);
  }, 0);

  return (
    <section className="rounded-[28px] border border-white/80 bg-white/88 p-6 shadow-[0_18px_54px_rgba(15,23,42,0.08)] xl:col-span-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-slate-950">
            Quiz
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Answer all the questions and check how much of the lesson stuck.
          </p>
        </div>
        <p className="text-sm font-medium text-slate-600">
          {answeredCount} of {questions.length} answered
        </p>
      </div>

      <div className="mt-6 grid gap-5">
        {questions.map((question, questionIndex) => (
          <fieldset
            key={question.id}
            className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4"
          >
            <legend className="px-1 text-base font-semibold leading-7 text-slate-900">
              {questionIndex + 1}. {question.question}
            </legend>
            <div className="mt-4 grid gap-3">
              {question.options.map((option, optionIndex) => {
                const isSelected = answers[question.id] === optionIndex;
                const isCorrect = question.correctIndex === optionIndex;
                const showCorrectState = submitted && isCorrect;
                const showWrongState = submitted && isSelected && !isCorrect;

                return (
                  <label
                    key={`${question.id}-${optionIndex}`}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                      showCorrectState
                        ? "border-emerald-300 bg-emerald-50"
                        : showWrongState
                          ? "border-rose-300 bg-rose-50"
                          : isSelected
                            ? "border-teal-400 bg-teal-50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      checked={isSelected}
                      onChange={() => onSelectAnswer(question.id, optionIndex)}
                      className="mt-1 h-4 w-4 border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm leading-6 text-slate-700">
                      {option}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onSubmit}
          disabled={questions.length === 0}
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Submit Answers
        </button>
        <div className="text-sm text-slate-600">
          {submitted
            ? `Score: ${score} / ${questions.length}`
            : "Your score appears here after you submit."}
        </div>
      </div>
    </section>
  );
}
