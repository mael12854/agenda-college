import type { Course } from "./types";
import { timeToMinutes } from "./date";

export const SCHOOL_DAY_START = "08:00";
export const SCHOOL_DAY_END = "17:00";

/**
 * A gap shorter than this is a normal passing period between two classes
 * ("intercours") — not a real "heure de trou". A 5-minute gap doesn't mean
 * you're free, it just means the next class is about to start, so it's
 * still shown (never silently skip time in the schedule) but as a
 * "passing" slot rather than genuine free time.
 */
export const MIN_FREE_SLOT_MINUTES = 15;

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

function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function isLiveNow(course: Course, now: Date): boolean {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return nowMin >= timeToMinutes(course.startTime) && nowMin < timeToMinutes(course.endTime);
}
