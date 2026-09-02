import type { Course } from "./types";
import { timeToMinutes } from "./date";

export const SCHOOL_DAY_START = "08:00";
export const SCHOOL_DAY_END = "17:00";

/**
 * A gap shorter than this isn't a real "heure de trou" — it's either the
 * few minutes it takes to change rooms ("intercours") or a récréation-sized
 * break ("pause"), not genuine free time to reclaim. Still shown (never
 * silently skip time in the schedule), just not styled as "Tu es libre".
 * A 15-minute gap is a récréation, not free time, so the threshold sits
 * above it.
 */
export const MIN_FREE_SLOT_MINUTES = 30;

/** At or below this, a non-free gap reads as "Intercours"; above it, "Pause". */
export const PASSING_LABEL_MAX_MINUTES = 10;

export interface FreeSlot {
  kind: "free";
  startTime: string;
  endTime: string;
}
export interface PassingSlot {
  kind: "passing";
  startTime: string;
  endTime: string;
}
export interface CourseSlot {
  kind: "course";
  course: Course;
}
export type DaySlot = FreeSlot | PassingSlot | CourseSlot;

/** Merges the day's courses with the gaps between them ("heures de trou" and "intercours"). */
export function buildDaySlots(coursesToday: Course[]): DaySlot[] {
  const slots: DaySlot[] = [];
  let cursor = timeToMinutes(SCHOOL_DAY_START);
  const dayEnd = timeToMinutes(SCHOOL_DAY_END);

  const pushGap = (start: number, end: number) => {
    if (end <= start) return;
    slots.push({
      kind: end - start >= MIN_FREE_SLOT_MINUTES ? "free" : "passing",
      startTime: minutesToTime(start),
      endTime: minutesToTime(end),
    });
  };

  for (const course of coursesToday) {
    const start = timeToMinutes(course.startTime);
    const end = timeToMinutes(course.endTime);
    if (start > cursor) {
      pushGap(cursor, start);
    }
    slots.push({ kind: "course", course });
    cursor = Math.max(cursor, end);
  }

  if (cursor < dayEnd) {
    pushGap(cursor, dayEnd);
  }

  return slots;
}

export function passingLabel(startTime: string, endTime: string): string {
  const minutes = timeToMinutes(endTime) - timeToMinutes(startTime);
  return minutes <= PASSING_LABEL_MAX_MINUTES ? "Intercours" : "Pause";
}

function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function isLiveNow(course: Course, now: Date): boolean {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return nowMin >= timeToMinutes(course.startTime) && nowMin < timeToMinutes(course.endTime);
}
