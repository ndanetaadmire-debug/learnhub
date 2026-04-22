import { useCallback, useEffect, useMemo, useState } from "react";
import type { QuizResult } from "../lib/grading";
import { canComplete, emptyProgress, flatten, percentComplete, type ProgressState, resumeLesson } from "../lib/progress";
import { newCard, type Card } from "../lib/srs";
import type { Course } from "../lib/types";
import { usePersistentState } from "../hooks/usePersistentState";
import { ProgressRing } from "./ProgressRing";
import { QuizView } from "./QuizView";

const isProgress = (v: unknown): v is ProgressState =>
  typeof v === "object" && v !== null && Array.isArray((v as ProgressState).completed) && typeof (v as ProgressState).quizScores === "object";
const isCards = (v: unknown): v is Card[] => Array.isArray(v);

export function CoursePlayer({ course, now = Date.now }: { course: Course; now?: () => number }) {
  const [progress, setProgress] = usePersistentState(`learnhub:${course.id}:progress`, emptyProgress, isProgress);
  const [, setCards] = usePersistentState<Card[]>(`learnhub:${course.id}:cards`, () => [], isCards);
  const lessons = useMemo(() => flatten(course), [course]);
  const [currentId, setCurrentId] = useState(() => resumeLesson(course, progress)?.id);
  const idx = lessons.findIndex((l) => l.id === currentId);
  const lesson = lessons[idx];

  useEffect(() => {
    if (currentId) setProgress((p) => (p.lastLessonId === currentId ? p : { ...p, lastLessonId: currentId }));
  }, [currentId, setProgress]);

  const go = useCallback((delta: number) => {
    const next = lessons[idx + delta];
    if (next) setCurrentId(next.id);
  }, [idx, lessons]);

  // Keyboard shortcuts: Alt+→ / Alt+← (Alt avoids clashing with screen-reader and text-input keys).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (!lesson) return <p>This course has no lessons yet.</p>;
  const done = progress.completed.includes(lesson.id);
  const completable = canComplete(lesson, progress);

  function onQuiz(result: QuizResult) {
    if (!lesson?.quiz) return;
    const quizId = lesson.quiz.id;
    setProgress((p) => ({ ...p, quizScores: { ...p.quizScores, [quizId]: Math.max(result.score, p.quizScores[quizId] ?? 0) } }));
    // Every question not fully correct becomes a spaced-repetition card.
    const missed = result.results.filter((r) => !r.correct).map((r) => r.questionId);
    setCards((cards) => [...cards, ...missed.filter((id) => !cards.some((c) => c.id === id)).map((id) => newCard(id, now()))]);
  }

  return (
    <div className="player">
      <nav aria-label="Course outline" className="outline">
        <header>
          <h1>{course.title}</h1>
          <ProgressRing percent={percentComplete(course, progress)} />
        </header>
        {course.modules.map((m) => (
          <section key={m.id}>
            <h2>{m.title}</h2>
            <ol>
              {m.lessons.map((l) => (
                <li key={l.id}>
                  <button type="button" aria-current={l.id === lesson.id ? "page" : undefined} onClick={() => setCurrentId(l.id)}>
                    <span aria-hidden="true">{progress.completed.includes(l.id) ? "✓" : "○"}</span> {l.title}
                    <span className="sr-only">{progress.completed.includes(l.id) ? " (completed)" : ""}</span>
                    <small>{l.minutes} min</small>
                  </button>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </nav>

      <main className="lesson">
        <h2>{lesson.title}</h2>
        <p>{lesson.body}</p>
        {lesson.quiz && <QuizView key={lesson.id} quiz={lesson.quiz} onSubmit={onQuiz} />}
        <div className="actions">
          <button type="button" onClick={() => go(-1)} disabled={idx === 0}>Previous</button>
          <button
            type="button"
            disabled={done || !completable}
            title={!completable ? "Pass the quiz to complete this lesson" : undefined}
            onClick={() => {
              setProgress((p) => ({ ...p, completed: [...new Set([...p.completed, lesson.id])] }));
              go(1);
            }}
          >
            {done ? "Completed" : "Mark complete"}
          </button>
          <button type="button" onClick={() => go(1)} disabled={idx === lessons.length - 1}>Next</button>
        </div>
      </main>
    </div>
  );
}
