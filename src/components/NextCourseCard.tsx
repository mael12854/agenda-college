import type { NextCourse } from "../lib/nextCourse";
import { relativeDayLabel } from "../lib/nextCourse";
import { minutesToDuration, timeToMinutes } from "../lib/date";
import "./NextCourseCard.css";

export function NextCourseCard({
  next,
  now,
}: {
  next: NextCourse | null;
  now: Date;
}) {
  if (!next) {
    return (
      <div className="next-course next-course--empty">
        <span className="next-course__eyebrow">Prochain cours</span>
        <div className="next-course__title">Rien de prévu</div>
      </div>
    );
  }

  const { course, date } = next;
  const dayLabel = relativeDayLabel(date, now);
  const isToday = dayLabel === "Aujourd'hui";
  const minutesUntil = isToday
    ? timeToMinutes(course.startTime) -
      (now.getHours() * 60 + now.getMinutes())
    : null;

  return (
    <div className="next-course">
      <span className="next-course__eyebrow">Prochain cours</span>
      <div className="next-course__row">
        <div>
          <div className="next-course__title">{course.subject}</div>
          <div className="next-course__meta">
            {isToday ? "Aujourd'hui" : dayLabel} à {course.startTime}
            {course.room ? ` · salle ${course.room}` : ""}
          </div>
        </div>
        {minutesUntil !== null && minutesUntil >= 0 && (
          <div className="next-course__countdown">
            dans {minutesToDuration(minutesUntil)}
          </div>
        )}
      </div>
    </div>
  );
}
