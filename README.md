# LearnHub

[![CI](https://github.com/ndanetaadmire-debug/learnhub/actions/workflows/ci.yml/badge.svg)](https://github.com/ndanetaadmire-debug/learnhub/actions/workflows/ci.yml)
![React](https://img.shields.io/badge/React-19-20232A?logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![a11y](https://img.shields.io/badge/a11y-keyboard%20%2B%20screen%20reader-0a7)
![Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen)

**An accessible course player** for an EdTech platform: lessons, assessments with fair partial credit, progress that survives refreshes and broken storage, and spaced-repetition review of what learners got wrong.

## What makes it senior-grade

**Learning science, not just pages**
- **SM-2 spaced repetition** (the algorithm behind Anki): every question a learner misses becomes a review card scheduled at 1 → 6 → ~15 days, resetting on a lapse
- **Fair multi-select grading**: right-minus-wrong partial credit floored at zero, so "tick everything" scores 0, not 50%
- **Mastery gating**: a lesson with a quiz can't be completed until the pass mark is met
- **Duration-weighted progress**: a 40-minute lesson counts more than a 3-minute one

**Accessibility as a feature**
- Native `fieldset`/`legend` + radio/checkbox inputs: full keyboard and screen-reader support for free
- Results announced via an `aria-live` region; focus moves to the result after submitting
- `aria-current` on the active lesson, real `progressbar` semantics, visible focus rings, `prefers-reduced-motion`, dark mode
- Alt+← / Alt+→ lesson navigation that doesn't fight screen-reader or text-input shortcuts
- Tests use **Testing Library role/label queries** and drive the quiz with the **keyboard alone**

**Resilient state**
- `usePersistentState` validates what it reads and swallows quota / private-mode / corrupt-JSON failures, falling back to memory instead of crashing (tested with corrupt storage)
- Resumes where the learner left off

## Architecture

```
src/
  lib/            pure, framework-free logic (100% unit-testable)
    grading.ts    partial-credit grading, pass marks, unanswered detection
    srs.ts        SM-2 scheduler
    progress.ts   weighted progress, resume, mastery gating
  hooks/          usePersistentState (validated, failure-tolerant)
  components/     CoursePlayer, QuizView, ProgressRing
  data/           sample course
```

Business rules live in `lib/` as pure functions; components only orchestrate. That split is why the logic is tested in milliseconds and the UI tests stay focused on behaviour users can see.

## Run

```bash
npm ci
npm run dev       # http://localhost:5173
npm run ci        # typecheck + 15 tests + production build
```

---

Built by **[Admire T. Ndaneta](https://admire-portfolio.vercel.app)** — senior full-stack engineer. MIT licensed.
