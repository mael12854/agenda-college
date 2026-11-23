import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { RECURRENCE_LABELS, recurrenceBadge, TERM_START, weekLetterFor } from "../lib/recurrence";
import { minutesToDuration, timeToMinutes, weekdayLabel } from "../lib/date";
import { buildDaySlots, passingLabel } from "../lib/schedule";
import { WeekToggle } from "../components/WeekToggle";
import { StatusBadge } from "../components/StatusBadge";
import { CourseInfoModal } from "../components/CourseInfoModal";
import { ImportScheduleButton } from "../components/ImportScheduleButton";
import { useState } from "react";
import type { Course, Weekday, WeekLetter } from "../lib/types";
import "./Courses.css";

const WEEKDAYS_ORDER: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

/**
 * Chronological key for the "Autres" bucket (monthly + one-off courses):
 * dated ("once") courses sort by date then time, so a whole imported week
 * reads day by day instead of interleaved by time-of-day across dates.
 * Undated ("monthly") courses have no date to sort by — they sort first.
 */
function otherCourseSortKey(course: Course): string {
  const date = course.recurrence.type === "once" ? course.recurrence.date : "";
  return `${date}T${course.startTime}`;
}

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
    }
  | { kind: "passing"; key: string; startTime: string; endTime: string }
  | { kind: "lunch"; key: string; startTime: string; endTime: string };

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
      if (slot.kind === "passing" || slot.kind === "lunch") {
        const key = `${weekday}-${slot.startTime}-${i}`;
        return slot.kind === "lunch"
          ? { kind: "lunch", key, startTime: slot.startTime, endTime: slot.endTime }
          : { kind: "passing", key, startTime: slot.startTime, endTime: slot.endTime };
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

function LunchRow({ row }: { row: Extract<PreviewRow, { kind: "lunch" }> }) {
  const duration = minutesToDuration(
    timeToMinutes(row.endTime) - timeToMinutes(row.startTime),
  );
  return (
    <li key={row.key}>
      <div className="courses__item courses__item--free courses__item--lunch">
        <div className="courses__time">
          {row.startTime}
          <br />
          <span className="courses__time-end">{row.endTime}</span>
        </div>
        <div className="courses__body">
          <div className="courses__head">
            <span className="courses__name">Pause déjeuner</span>
            <span className="courses__badge courses__badge--free">{duration}</span>
          </div>
          <div className="courses__meta">Bon appétit</div>
        </div>
      </div>
    </li>
  );
}

function PassingRow({ row }: { row: Extract<PreviewRow, { kind: "passing" }> }) {
  const duration = minutesToDuration(
    timeToMinutes(row.endTime) - timeToMinutes(row.startTime),
  );
  return (
    <li key={row.key}>
      <div className="courses__item courses__item--passing">
        <span className="courses__passing-time">
          {row.startTime}–{row.endTime}
        </span>
        <span>{passingLabel(row.startTime, row.endTime)}</span>
        <span className="courses__passing-duration">{duration}</span>
      </div>
    </li>
  );
}

function CourseRow({ course, onSelect }: { course: Course; onSelect: (course: Course) => void }) {
  const badge = recurrenceBadge(course);
  const cancelled = course.status === "annule";
  return (
    <li key={course.id}>
      <button
        type="button"
        onClick={() => onSelect(course)}
        className={"courses__item courses__item--button" + (cancelled ? " courses__item--cancelled" : "")}
      >
        <div className="courses__time">
          {course.startTime}
          <br />
          <span className="courses__time-end">{course.endTime}</span>
        </div>
        <div className="courses__body">
          <div className="courses__head">
            <span className="courses__name">{course.subject}</span>
            <div className="courses__badges">
              <StatusBadge status={course.status} />
              {badge && <span className="courses__badge">{badge}</span>}
            </div>
          </div>
          <div className="courses__meta">{recurrenceSummary(course)}</div>
        </div>
      </button>
    </li>
  );
}

export function Courses() {
  const { courses } = useStore();
  const actualWeek = weekLetterFor(new Date(), TERM_START);
  const [previewWeek, setPreviewWeek] = useState<WeekLetter>(actualWeek);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const { dayGroups, otherCourses } = buildWeekPreview(courses, previewWeek);
  const isEmpty = dayGroups.length === 0 && otherCourses.length === 0;
  const showDayHeaders = dayGroups.length > 1;

  if (courses.length === 0) {
    return (
      <div className="screen">
        <span className="eyebrow">Cours récurrents</span>
        <h1 className="title-xl">Tes cours</h1>
        <div className="card courses__empty">
          Aucun emploi du temps — importe un JSON pour commencer.
        </div>
        <ImportScheduleButton />
      </div>
    );
  }

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
                {group.rows.map((row) => {
                  if (row.kind === "free") return <FreeRow key={row.key} row={row} />;
                  if (row.kind === "lunch") return <LunchRow key={row.key} row={row} />;
                  if (row.kind === "passing") return <PassingRow key={row.key} row={row} />;
                  return <CourseRow key={row.key} course={row.course} onSelect={setSelectedCourse} />;
                })}
              </ul>
            </div>
          ))}

          {otherCourses.length > 0 && (
            <div className="courses__day-group">
              {showDayHeaders && <span className="courses__day-heading">Autres</span>}
              <ul className="courses__list">
                {otherCourses
                  .slice()
                  .sort((a, b) => otherCourseSortKey(a).localeCompare(otherCourseSortKey(b)))
                  .map((course) => (
                    <CourseRow key={course.id} course={course} onSelect={setSelectedCourse} />
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

      {selectedCourse && (
        <CourseInfoModal course={selectedCourse} onClose={() => setSelectedCourse(null)} />
      )}
    </div>
  );
}
