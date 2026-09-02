import { useMemo, useState } from "react";
import { useStore } from "../lib/store";
import { addDays, formatDayHeading, isSameDate } from "../lib/date";
import { coursesOn } from "../lib/recurrence";
import { buildDaySlots, isLiveNow } from "../lib/schedule";
import { DaySlotRow } from "../components/DaySlotRow";
import "./Today.css";

export function Today() {
  const { settings, courses, homework } = useStore();
  const [offset, setOffset] = useState(0);
  const now = useMemo(() => new Date(), []);
  const date = useMemo(() => addDays(now, offset), [now, offset]);
  const today = isSameDate(date, now);

  const todaysCourses = useMemo(
    () => coursesOn(courses, date, settings.termStart),
    [courses, date, settings.termStart],
  );
  const slots = useMemo(() => buildDaySlots(todaysCourses), [todaysCourses]);

  const pendingHomework = useMemo(
    () => homework.filter((h) => !h.done),
    [homework],
  );

  return (
    <div className="screen">
      <div className="today__header">
        <span className="eyebrow">
          {settings.firstName ? `Salut ${settings.firstName}` : "Ta journée"}
        </span>
        <div className="today__nav">
          <button
            type="button"
            className="today__nav-btn"
            onClick={() => setOffset((o) => o - 1)}
            aria-label="Jour précédent"
          >
            ‹
          </button>
          <button
            type="button"
            className="today__nav-btn"
            onClick={() => setOffset((o) => o + 1)}
            aria-label="Jour suivant"
          >
            ›
          </button>
        </div>
      </div>
      <h1 className="title-xl">{formatDayHeading(date)}</h1>
      <p className="today__summary">
        {todaysCourses.length === 0
          ? "Aucun cours ce jour."
          : `${todaysCourses.length} cours${
              slots.some((s) => s.kind === "free") ? ", des heures de trou" : ""
            }.`}
      </p>

      {slots.length === 0 ? (
        <div className="card today__empty">Rien de prévu aujourd'hui.</div>
      ) : (
        <div className="today__slots">
          {slots.map((slot, i) => (
            <DaySlotRow
              key={i}
              slot={slot}
              live={
                today &&
                slot.kind === "course" &&
                isLiveNow(slot.course, now)
              }
            />
          ))}
        </div>
      )}

      {pendingHomework.length > 0 && (
        <div className="today__homework">
          <span className="today__homework-count">{pendingHomework.length}</span>
          <span>
            devoir{pendingHomework.length > 1 ? "s" : ""} à rendre
          </span>
        </div>
      )}
    </div>
  );
}
