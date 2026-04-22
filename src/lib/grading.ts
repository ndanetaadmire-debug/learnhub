import type { Question, Quiz } from "./types";

export type Response = number | number[] | undefined;

export interface QuestionResult {
  questionId: string;
  score: number; // 0..1
  correct: boolean;
}

export interface QuizResult {
  score: number; // 0..1
  passed: boolean;
  results: QuestionResult[];
  unanswered: string[];
}

/**
 * Multi-select uses "right minus wrong" partial credit, floored at 0:
 * picking every option can never score more than picking none.
 */
export function gradeQuestion(q: Question, r: Response): QuestionResult {
  if (q.kind === "single") {
    const ok = r === q.answer;
    return { questionId: q.id, score: ok ? 1 : 0, correct: ok };
  }
  const picked = new Set(Array.isArray(r) ? r : []);
  const answer = new Set(q.answer);
  let right = 0;
  let wrong = 0;
  for (const p of picked) (answer.has(p) ? right++ : wrong++);
  const score = Math.max(0, (right - wrong) / answer.size);
  return { questionId: q.id, score, correct: score === 1 && picked.size === answer.size };
}

export function gradeQuiz(quiz: Quiz, responses: Record<string, Response>): QuizResult {
  const results = quiz.questions.map((q) => gradeQuestion(q, responses[q.id]));
  const unanswered = quiz.questions
    .filter((q) => {
      const r = responses[q.id];
      return r === undefined || (Array.isArray(r) && r.length === 0);
    })
    .map((q) => q.id);
  const score = results.reduce((s, r) => s + r.score, 0) / Math.max(1, quiz.questions.length);
  return { score, passed: score >= quiz.passMark, results, unanswered };
}
