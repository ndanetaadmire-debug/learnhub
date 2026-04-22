import { useId, useState } from "react";
import { gradeQuiz, type QuizResult, type Response } from "../lib/grading";
import type { Quiz } from "../lib/types";

interface Props {
  quiz: Quiz;
  onSubmit: (result: QuizResult) => void;
}

/**
 * Accessible quiz: native fieldset/legend + radio/checkbox inputs (free keyboard
 * and screen-reader support), results announced via an aria-live region, focus
 * moved to the result so keyboard users aren't left at the bottom of the form.
 */
export function QuizView({ quiz, onSubmit }: Props) {
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [showUnanswered, setShowUnanswered] = useState(false);
  const baseId = useId();

  const graded = (qid: string) => result?.results.find((r) => r.questionId === qid);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = gradeQuiz(quiz, responses);
    if (r.unanswered.length > 0 && !showUnanswered) {
      setShowUnanswered(true);
      return;
    }
    setResult(r);
    onSubmit(r);
    requestAnimationFrame(() => document.getElementById(`${baseId}-result`)?.focus());
  }

  function retry() {
    setResponses({});
    setResult(null);
    setShowUnanswered(false);
  }

  return (
    <form onSubmit={submit} aria-label="Lesson quiz" className="quiz">
      {quiz.questions.map((q, qi) => {
        const g = graded(q.id);
        const missing = showUnanswered && !result && gradeQuiz(quiz, responses).unanswered.includes(q.id);
        return (
          <fieldset key={q.id} className="question" aria-invalid={missing || undefined} disabled={!!result}>
            <legend>
              {qi + 1}. {q.prompt}
              {q.kind === "multi" && <span className="hint"> (select all that apply)</span>}
            </legend>
            {q.options.map((opt, oi) => {
              const id = `${baseId}-${q.id}-${oi}`;
              const checked = q.kind === "single" ? responses[q.id] === oi : ((responses[q.id] as number[] | undefined) ?? []).includes(oi);
              return (
                <div key={oi} className="option">
                  <input
                    id={id}
                    type={q.kind === "single" ? "radio" : "checkbox"}
                    name={`${baseId}-${q.id}`}
                    checked={checked}
                    onChange={() =>
                      setResponses((prev) => {
                        if (q.kind === "single") return { ...prev, [q.id]: oi };
                        const cur = new Set((prev[q.id] as number[] | undefined) ?? []);
                        if (cur.has(oi)) cur.delete(oi);
                        else cur.add(oi);
                        return { ...prev, [q.id]: [...cur].sort() };
                      })
                    }
                  />
                  <label htmlFor={id}>{opt}</label>
                </div>
              );
            })}
            {missing && <p className="warn">Please answer this question.</p>}
            {g && (
              <p className={g.correct ? "ok" : "bad"}>
                {g.correct ? "Correct." : g.score > 0 ? `Partly correct (${Math.round(g.score * 100)}%).` : "Not quite."} {q.explanation}
              </p>
            )}
          </fieldset>
        );
      })}

      <div aria-live="polite" id={`${baseId}-result`} tabIndex={-1} className="result">
        {result && (
          <p>
            You scored <strong>{Math.round(result.score * 100)}%</strong>. {result.passed ? "Passed — lesson can be completed." : `You need ${Math.round(quiz.passMark * 100)}% to pass.`}
          </p>
        )}
      </div>

      {result ? (
        !result.passed && (
          <button type="button" onClick={retry}>
            Try again
          </button>
        )
      ) : (
        <button type="submit">{showUnanswered ? "Submit anyway" : "Check answers"}</button>
      )}
    </form>
  );
}
