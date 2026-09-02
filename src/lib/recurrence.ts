import type { Course, WeekLetter } from "./types";
import { fromISODate, mondayOf, toWeekday } from "./date";

/**
 * The term-start Monday is always "semaine A". Week letters alternate every
 * ISO week from there, so we only need the number of weeks between the two
 * Mondays (mod 2) to know which letter a given date falls in.
 */
export function weekLetterFor(date: Date, termStartISO: string): WeekLetter {
  const termMonday = mondayOf(fromISODate(termStartISO));
  const dateMonday = mondayOf(date);
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksSinceTerm = Math.round(
    (dateMonday.getTime() - termMonday.getTime()) / msPerWeek,
  );
  // Modulo that stays positive for dates before the term start too.
  const parity = ((weeksSinceTerm % 2) + 2) % 2;
  return parity === 0 ? "A" : "B";
}

/** Whether `course` has an occurrence on `date`, given the term start reference. */
export function occursOn(
  course: Course,
  date: Date,
  termStartISO: string,
): boolean {
  const r = course.recurrence;
  const weekday = toWeekday(date);
  switch (r.type) {
    case "weekly":
      return r.weekday === weekday;
    case "ab":
      return r.weekday === weekday && weekLetterFor(date, termStartISO) === r.week;
    case "daily":
      return r.weekdays.includes(weekday);
    case "monthly":
      return date.getDate() === r.dayOfMonth;
    case "once": {
      const [y, m, d] = r.date.split("-").map(Number);
      return (
        date.getFullYear() === y &&
        date.getMonth() === m - 1 &&
        date.getDate() === d
      );
    }
  }
}

export function coursesOn(
  courses: Course[],
  date: Date,
  termStartISO: string,
): Course[] {
  return courses
    .filter((c) => occursOn(c, date, termStartISO))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export const RECURRENCE_LABELS: Record<string, string> = {
  weekly: "Chaque semaine",
  ab: "Semaine A / B",
  daily: "Chaque jour d'école",
  monthly: "1× / mois",
  once: "Ponctuel",
};

export function recurrenceBadge(course: Course): string | null {
  switch (course.recurrence.type) {
    case "weekly":
      return null; // le cas par défaut, pas de pastille
    case "ab":
      return `↻ SEM. ${course.recurrence.week}`;
    case "daily":
      return "↻ CHAQUE JOUR";
    case "monthly":
      return "↻ 1×/MOIS";
    case "once":
      return null;
  }
}
