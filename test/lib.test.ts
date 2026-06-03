import { describe, expect, it } from "vitest";
import { sampleCourse } from "../src/data/course";
import { gradeQuestion, gradeQuiz } from "../src/lib/grading";
import { canComplete, emptyProgress, percentComplete, resumeLesson } from "../src/lib/progress";
import { dueCards, newCard, review } from "../src/lib/srs";
import type { Question } from "../src/lib/types";

const multi: Question = { id: "m", kind: "multi", prompt: "", options: ["a", "b", "c", "d"], answer: [0, 2], explanation: "" };

describe("grading", () => {
  it("gives right-minus-wrong partial credit, floored at zero", () => {
    expect(gradeQuestion(multi, [0, 2])).toMatchObject({ score: 1, correct: true });
    expect(gradeQuestion(multi, [0])).toMatchObject({ score: 0.5, correct: false });
    expect(gradeQuestion(multi, [0, 1])).toMatchObject({ score: 0 });
    expect(gradeQuestion(multi, [0, 1, 2, 3]).score).toBe(0); // select-all is not a strategy
  });

  it("grades a quiz against its pass mark and reports unanswered questions", () => {
    const quiz = sampleCourse.modules[0]!.lessons[1]!.quiz!;
    expect(gradeQuiz(quiz, { q1: 1, q2: [0, 2] })).toMatchObject({ score: 1, passed: true, unanswered: [] });
    expect(gradeQuiz(quiz, { q1: 1, q2: [0] })).toMatchObject({ score: 0.75, passed: true });
    expect(gradeQuiz(quiz, { q1: 0 })).toMatchObject({ passed: false, unanswered: ["q2"] });
  });
});

describe("SM-2 spaced repetition", () => {
  const DAY = 86_400_000;
  it("grows intervals 1 → 6 → ~15 days on good recall", () => {
    let c = newCard("q", 0);
    c = review(c, 4, 0);
    expect(c.intervalDays).toBe(1);
    c = review(c, 4, c.dueAt);
    expect(c.intervalDays).toBe(6);
    c = review(c, 4, c.dueAt);
    expect(c.intervalDays).toBe(15);
  });

  it("resets on a lapse and lowers ease, never below 1.3", () => {
    let c = { ...newCard("q", 0), repetitions: 5, intervalDays: 40, ease: 1.35 };
    c = review(c, 1, 0);
    expect(c).toMatchObject({ repetitions: 0, intervalDays: 1, ease: 1.3, dueAt: DAY });
  });

  it("returns due cards oldest first", () => {
    const cards = [{ ...newCard("b", 5) }, { ...newCard("a", 1) }, { ...newCard("future", 99) }];
    expect(dueCards(cards, 10).map((c) => c.id)).toEqual(["a", "b"]);
  });
});

describe("progress", () => {
  it("weights completion by lesson length", () => {
    expect(percentComplete(sampleCourse, { ...emptyProgress(), completed: ["l2"] })).toBe(40); // 12 of 30 minutes
  });
  it("resumes at the last lesson, else the first incomplete one", () => {
    expect(resumeLesson(sampleCourse, { ...emptyProgress(), lastLessonId: "l3" })?.id).toBe("l3");
    expect(resumeLesson(sampleCourse, { ...emptyProgress(), completed: ["l1"] })?.id).toBe("l2");
  });
  it("requires passing the quiz before completing a quiz lesson", () => {
    const l2 = sampleCourse.modules[0]!.lessons[1]!;
    expect(canComplete(l2, emptyProgress())).toBe(false);
    expect(canComplete(l2, { ...emptyProgress(), quizScores: { "q-injection": 0.8 } })).toBe(true);
  });
});
