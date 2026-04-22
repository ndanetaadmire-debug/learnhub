import type { Course, Lesson } from "./types";

export interface ProgressState {
  completed: string[]; // lesson ids
  lastLessonId?: string;
  quizScores: Record<string, number>;
}

export const emptyProgress = (): ProgressState => ({ completed: [], quizScores: {} });

export function flatten(course: Course): Lesson[] {
  return course.modules.flatMap((m) => m.lessons);
}

/** Progress weighted by lesson duration: finishing a 40-minute lesson counts more than a 3-minute one. */
export function percentComplete(course: Course, p: ProgressState): number {
  const lessons = flatten(course);
  const total = lessons.reduce((s, l) => s + l.minutes, 0);
  const done = lessons.filter((l) => p.completed.includes(l.id)).reduce((s, l) => s + l.minutes, 0);
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

/** Where to resume: the last opened lesson, else the first incomplete one. */
export function resumeLesson(course: Course, p: ProgressState): Lesson | undefined {
  const lessons = flatten(course);
  return lessons.find((l) => l.id === p.lastLessonId) ?? lessons.find((l) => !p.completed.includes(l.id)) ?? lessons[0];
}

/** A lesson with a quiz is only complete once the quiz is passed. */
export function canComplete(lesson: Lesson, p: ProgressState): boolean {
  if (!lesson.quiz) return true;
  return (p.quizScores[lesson.quiz.id] ?? 0) >= lesson.quiz.passMark;
}
