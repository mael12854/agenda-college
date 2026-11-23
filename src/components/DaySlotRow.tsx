import type { Course } from "../lib/types";
import { minutesToDuration, timeToMinutes } from "../lib/date";
import { recurrenceBadge } from "../lib/recurrence";
import { passingLabel, type DaySlot } from "../lib/schedule";
import { StatusBadge } from "./StatusBadge";
import "./DaySlotRow.css";

export function DaySlotRow({
  slot,
  live,
  onSelectCourse,
}: {
  slot: DaySlot;
  live: boolean;
  /** When set, tapping a course slot calls this instead of doing nothing. */
  onSelectCourse?: (course: Course) => void;
}) {
  if (slot.kind === "free" || slot.kind === "lunch") {
    const lunch = slot.kind === "lunch";
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
        <div
          className={
            "day-slot__block day-slot__block--free" +
            (lunch ? " day-slot__block--lunch" : "")
          }
        >
          <div className="day-slot__free-head">
            <span className="day-slot__free-label">
              {lunch ? "Pause déjeuner" : "Heure de trou"}
            </span>
            <span className="day-slot__free-duration">{duration}</span>
          </div>
          <div className="day-slot__free-title">{lunch ? "Bon appétit" : "Tu es libre"}</div>
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
          <span>{passingLabel(slot.startTime, slot.endTime)}</span>
          <span className="day-slot__passing-duration">{duration}</span>
        </div>
      </div>
    );
  }

  return <CourseRow course={slot.course} live={live} onSelect={onSelectCourse} />;
}

function CourseRow({
  course,
  live,
  onSelect,
}: {
  course: Course;
  live: boolean;
  onSelect?: (course: Course) => void;
}) {
  const badge = recurrenceBadge(course);
  const cancelled = course.status === "annule";
  return (
    <div className="day-slot">
      <div className="day-slot__time">
        {course.startTime}
        <br />
        <span className="day-slot__time-end">{course.endTime}</span>
      </div>
      <div
        role={onSelect ? "button" : undefined}
        tabIndex={onSelect ? 0 : undefined}
        onClick={onSelect ? () => onSelect(course) : undefined}
        onKeyDown={
          onSelect
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") onSelect(course);
              }
            : undefined
        }
        className={
          "day-slot__block " +
          (cancelled
            ? "day-slot__block--cancelled"
            : live
              ? "day-slot__block--live"
              : "day-slot__block--course") +
          (onSelect ? " day-slot__block--tappable" : "")
        }
      >
        {live && !cancelled && (
          <div className="day-slot__live-tag">
            <span className="day-slot__live-dot" />
            EN COURS
          </div>
        )}
        <div className="day-slot__course-head">
          <div className="day-slot__course-name">{course.subject}</div>
          <div className="day-slot__badges">
            <StatusBadge status={course.status} />
            {badge && <span className="day-slot__badge">{badge}</span>}
          </div>
        </div>
        <div className="day-slot__course-meta">
          {course.substituteFor && course.teacher
            ? `${course.teacher} (remplace ${course.substituteFor})`
            : course.teacher}
          {course.teacher && course.room ? " · " : ""}
          {course.room}
        </div>
      </div>
    </div>
  );
}
