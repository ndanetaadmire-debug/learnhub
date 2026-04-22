export interface Lesson {
  id: string;
  title: string;
  minutes: number;
  body: string;
  quiz?: Quiz;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  modules: Module[];
}

export type Question =
  | { id: string; kind: "single"; prompt: string; options: string[]; answer: number; explanation: string }
  | { id: string; kind: "multi"; prompt: string; options: string[]; answer: number[]; explanation: string };

export interface Quiz {
  id: string;
  passMark: number; // 0..1
  questions: Question[];
}
