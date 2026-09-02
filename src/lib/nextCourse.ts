import type { Course } from "./types";
import { addDays, isSameDate, timeToMinutes } from "./date";
import { coursesOn } from "./recurrence";

export interface NextCourse {
  course: Course;
  date: Date;
}

const MAX_DAYS_AHEAD = 14;

/** The next course to happen from `now`, scanning forward day by day. */
export function findNextCourse(
  courses: Course[],
  now: Date,
  termStartISO: string,
): NextCourse | null {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  for (let dayOffset = 0; dayOffset <= MAX_DAYS_AHEAD; dayOffset++) {
    const date = addDays(now, dayOffset);
    const dayCourses = coursesOn(courses, date, termStartISO);
    const upcoming = dayCourses.find((c) => {
      if (dayOffset > 0) return true;
      return timeToMinutes(c.startTime) > nowMinutes;
    });
    if (upcoming) return { course: upcoming, date };
  }
  return null;
}

export function relativeDayLabel(date: Date, now: Date): string {
  if (isSameDate(date, now)) return "Aujourd'hui";
  if (isSameDate(date, addDays(now, 1))) return "Demain";
  const WEEKDAY_LABELS = [
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi",
    "dimanche",
  ];
  const wd = ((date.getDay() + 6) % 7) as number;
  return `${WEEKDAY_LABELS[wd]} ${date.getDate()}`;
}
