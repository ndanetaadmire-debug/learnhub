/**
 * SM-2 spaced repetition (SuperMemo 2), the algorithm behind Anki.
 * Missed quiz questions become review cards scheduled at growing intervals.
 */
export interface Card {
  id: string;
  ease: number; // ≥ 1.3
  intervalDays: number;
  repetitions: number;
  dueAt: number; // epoch ms
}

/** 0 = blackout … 5 = perfect recall. < 3 counts as a lapse. */
export type Grade = 0 | 1 | 2 | 3 | 4 | 5;

const DAY = 86_400_000;

export function newCard(id: string, now: number): Card {
  return { id, ease: 2.5, intervalDays: 0, repetitions: 0, dueAt: now };
}

export function review(card: Card, grade: Grade, now: number): Card {
  if (grade < 3) {
    return { ...card, repetitions: 0, intervalDays: 1, dueAt: now + DAY, ease: Math.max(1.3, card.ease - 0.2) };
  }
  const repetitions = card.repetitions + 1;
  const intervalDays = repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.round(card.intervalDays * card.ease);
  const ease = Math.max(1.3, card.ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)));
  return { ...card, repetitions, intervalDays, ease, dueAt: now + intervalDays * DAY };
}

export function dueCards(cards: Card[], now: number): Card[] {
  return cards.filter((c) => c.dueAt <= now).sort((a, b) => a.dueAt - b.dueAt);
}
