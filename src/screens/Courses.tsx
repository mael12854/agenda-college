import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { RECURRENCE_LABELS, recurrenceBadge, weekLetterFor } from "../lib/recurrence";
import { minutesToDuration, timeToMinutes, weekdayLabel } from "../lib/date";
import { buildDaySlots } from "../lib/schedule";
import { WeekToggle } from "../components/WeekToggle";
import { useState } from "react";
import type { Course, Weekday, WeekLetter } from "../lib/types";
import "./Courses.css";

const WEEKDAYS_ORDER: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

function recurrenceSummary(course: Course): string {
  const r = course.recurrence;
  switch (r.type) {
    case "weekly":
      return `${weekdayLabel(r.weekday)} · toutes les semaines`;
    case "ab":
      return `${weekdayLabel(r.weekday)} · semaine ${r.week} · une semaine sur deux`;
    case "daily":
      return `Chaque jour d'école`;
    case "monthly":
      return `Le ${r.dayOfMonth} du mois`;
    case "once":
      return `Ponctuel · ${r.date}`;
  }
}

type PreviewRow =
  | { kind: "course"; key: string; course: Course }
  | {
      kind: "free";
      key: string;
      startTime: string;
      endTime: string;
      /** The A/B course that would occupy this exact slot on the other week, if any. */
      altCourse: Course | null;
    };

interface DayGroup {
  weekday: Weekday;
  rows: PreviewRow[];
}

function coursesOnWeekday(courses: Course[], weekday: Weekday): Course[] {
  return courses.filter((c) => {
    const r = c.recurrence;
    if (r.type === "weekly" || r.type === "ab") return r.weekday === weekday;
    if (r.type === "daily") return r.weekdays.includes(weekday);
    return false;
  });
}

/**
 * Resolves each weekday to a single ordered timeline for the previewed week:
 * the courses actually happening that week, with every gap between them
 * (including a dropped A/B course's own slot) computed the same way the day
 * view computes "heures de trou" — one mechanism instead of two, so a slot
 * never renders both a real class and a "libre" ghost, and every real gap
 * (not just A/B alternation) is detected.
 */
function buildWeekPreview(
  courses: Course[],
  previewWeek: WeekLetter,
): { dayGroups: DayGroup[]; otherCourses: Course[] } {
  const dayGroups: DayGroup[] = [];

  for (const weekday of WEEKDAYS_ORDER) {
    const coursesThisDay = coursesOnWeekday(courses, weekday);
    if (coursesThisDay.length === 0) continue;

    const activeCourses = coursesThisDay
      .filter((c) => c.recurrence.type !== "ab" || c.recurrence.week === previewWeek)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const inactiveAb = coursesThisDay.filter(
      (c) => c.recurrence.type === "ab" && c.recurrence.week !== previewWeek,
    );

    const slots = buildDaySlots(activeCourses);

    const rows: PreviewRow[] = slots.map((slot, i) => {
      if (slot.kind === "course") {
        return { kind: "course", key: slot.course.id, course: slot.course };
      }
      const altCourse =
        inactiveAb.find(
          (c) =>
            timeToMinutes(c.startTime) < timeToMinutes(slot.endTime) &&
            timeToMinutes(c.endTime) > timeToMinutes(slot.startTime),
        ) ?? null;
      return {
        kind: "free",
        key: `${weekday}-${slot.startTime}-${i}`,
        startTime: slot.startTime,
        endTime: slot.endTime,
        altCourse,
      };
    });

    dayGroups.push({ weekday, rows });
  }

  const otherCourses = courses.filter(
    (c) => c.recurrence.type === "monthly" || c.recurrence.type === "once",
  );

  return { dayGroups, otherCourses };
}

function FreeRow({ row }: { row: Extract<PreviewRow, { kind: "free" }> }) {
  const duration = minutesToDuration(
    timeToMinutes(row.endTime) - timeToMinutes(row.startTime),
  );
  return (
    <li key={row.key}>
      <div className="courses__item courses__item--free">
        <div className="courses__time">
          {row.startTime}
          <br />
          <span className="courses__time-end">{row.endTime}</span>
        </div>
        <div className="courses__body">
          <div className="courses__head">
            <span className="courses__name">Tu es libre</span>
            <span className="courses__badge courses__badge--free">{duration}</span>
          </div>
          <div className="courses__meta">
            {row.altCourse
              ? `Pas de ${row.altCourse.subject.toLowerCase()} cette semaine`
              : "Heure de trou"}
          </div>
        </div>
      </div>
    </li>
  );
}

function CourseRow({ course }: { course: Course }) {
  const badge = recurrenceBadge(course);
  return (
    <li key={course.id}>
      <Link to={`/cours/${course.id}`} className="courses__item">
        <div className="courses__time">
          {course.startTime}
          <br />
          <span className="courses__time-end">{course.endTime}</span>
        </div>
        <div className="courses__body">
          <div className="courses__head">
            <span className="courses__name">{course.subject}</span>
            {badge && <span className="courses__badge">{badge}</span>}
          </div>
          <div className="courses__meta">{recurrenceSummary(course)}</div>
        </div>
      </Link>
    </li>
  );
}

export function Courses() {
  const { courses, settings } = useStore();
  const actualWeek = weekLetterFor(new Date(), settings.termStart);
  const [previewWeek, setPreviewWeek] = useState<WeekLetter>(actualWeek);

  const { dayGroups, otherCourses } = buildWeekPreview(courses, previewWeek);
  const isEmpty = dayGroups.length === 0 && otherCourses.length === 0;
  const showDayHeaders = dayGroups.length > 1;

  return (
    <div className="screen">
      <span className="eyebrow">Cours récurrents</span>
      <h1 className="title-xl">Tes cours</h1>
      <p className="courses__intro">
        Un cours ajouté à la main garde le violet — la récurrence se lit dans
        une pastille, jamais dans une nouvelle couleur.
      </p>

      <WeekToggle active={previewWeek} onChange={setPreviewWeek} />

      {isEmpty ? (
        <div className="card courses__empty">
          Aucun cours pour l'instant. Ajoute ton premier cours ci-dessous.
        </div>
      ) : (
        <>
          {dayGroups.map((group) => (
            <div key={group.weekday} className="courses__day-group">
              {showDayHeaders && (
                <span className="courses__day-heading">{weekdayLabel(group.weekday)}</span>
              )}
              <ul className="courses__list">
                {group.rows.map((row) =>
                  row.kind === "free" ? (
                    <FreeRow key={row.key} row={row} />
                  ) : (
                    <CourseRow key={row.key} course={row.course} />
                  ),
                )}
              </ul>
            </div>
          ))}

          {otherCourses.length > 0 && (
            <div className="courses__day-group">
              {showDayHeaders && <span className="courses__day-heading">Autres</span>}
              <ul className="courses__list">
                {otherCourses
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((course) => (
                    <CourseRow key={course.id} course={course} />
                  ))}
              </ul>
            </div>
          )}
        </>
      )}

      <Link to="/cours/nouveau" className="courses__add">
        <span className="courses__add-icon">+</span>
        <span>Ajouter un cours — puis choisir sa récurrence</span>
      </Link>

      <div className="courses__footer">
        <strong>Types de récurrence&nbsp;:</strong>{" "}
        {Object.values(RECURRENCE_LABELS).join(" · ")}.
      </div>
    </div>
  );
}
