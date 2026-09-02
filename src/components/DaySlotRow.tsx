import type { Course } from "../lib/types";
import { minutesToDuration, timeToMinutes } from "../lib/date";
import { recurrenceBadge } from "../lib/recurrence";
import type { DaySlot } from "../lib/schedule";
import "./DaySlotRow.css";

export function DaySlotRow({
  slot,
  live,
}: {
  slot: DaySlot;
  live: boolean;
}) {
  if (slot.kind === "free") {
    const duration = minutesToDuration(
      timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime),
    );
    return (
      <div className="day-slot">
        <div className="day-slot__time">
          {slot.startTime}
          <br />
          <span className="day-slot__time-end">{slot.endTime}</span>
        </div>
        <div className="day-slot__block day-slot__block--free">
          <div className="day-slot__free-head">
            <span className="day-slot__free-label">Heure de trou</span>
            <span className="day-slot__free-duration">{duration}</span>
          </div>
          <div className="day-slot__free-title">Tu es libre</div>
        </div>
      </div>
    );
  }

  if (slot.kind === "passing") {
    const duration = minutesToDuration(
      timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime),
    );
    return (
      <div className="day-slot day-slot--passing">
        <div className="day-slot__time">
          {slot.startTime}
          <br />
          <span className="day-slot__time-end">{slot.endTime}</span>
        </div>
        <div className="day-slot__block day-slot__block--passing">
          <span>Intercours</span>
          <span className="day-slot__passing-duration">{duration}</span>
        </div>
      </div>
    );
  }

  return <CourseRow course={slot.course} live={live} />;
}

function CourseRow({ course, live }: { course: Course; live: boolean }) {
  const badge = recurrenceBadge(course);
  return (
    <div className="day-slot">
      <div className="day-slot__time">
        {course.startTime}
        <br />
        <span className="day-slot__time-end">{course.endTime}</span>
      </div>
      <div
        className={
          "day-slot__block " +
          (live ? "day-slot__block--live" : "day-slot__block--course")
        }
      >
        {live && (
          <div className="day-slot__live-tag">
            <span className="day-slot__live-dot" />
            EN COURS
          </div>
        )}
        <div className="day-slot__course-head">
          <div className="day-slot__course-name">{course.subject}</div>
          {badge && <span className="day-slot__badge">{badge}</span>}
        </div>
        <div className="day-slot__course-meta">
          {course.teacher}
          {course.teacher && course.room ? " · " : ""}
          {course.room}
        </div>
      </div>
    </div>
  );
}
