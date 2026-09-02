import type { Course } from "./types";
import { timeToMinutes } from "./date";

export const SCHOOL_DAY_START = "08:00";
export const SCHOOL_DAY_END = "17:00";

export interface FreeSlot {
  kind: "free";
  startTime: string;
  endTime: string;
}
export interface CourseSlot {
  kind: "course";
  course: Course;
}
export type DaySlot = FreeSlot | CourseSlot;

/** Merges the day's courses with the gaps between them ("heures de trou"). */
export function buildDaySlots(coursesToday: Course[]): DaySlot[] {
  const slots: DaySlot[] = [];
  let cursor = timeToMinutes(SCHOOL_DAY_START);
  const dayEnd = timeToMinutes(SCHOOL_DAY_END);

  for (const course of coursesToday) {
    const start = timeToMinutes(course.startTime);
    const end = timeToMinutes(course.endTime);
    if (start > cursor) {
      slots.push({
        kind: "free",
        startTime: minutesToTime(cursor),
        endTime: minutesToTime(start),
      });
    }
    slots.push({ kind: "course", course });
    cursor = Math.max(cursor, end);
  }

  if (cursor < dayEnd) {
    slots.push({
      kind: "free",
      startTime: minutesToTime(cursor),
      endTime: minutesToTime(dayEnd),
    });
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
