import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { RECURRENCE_LABELS, recurrenceBadge, weekLetterFor } from "../lib/recurrence";
import { weekdayLabel } from "../lib/date";
import { WeekToggle } from "../components/WeekToggle";
import { useState } from "react";
import type { WeekLetter } from "../lib/types";
import "./Courses.css";

function recurrenceSummary(course: import("../lib/types").Course): string {
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

export function Courses() {
  const { courses, settings } = useStore();
  const actualWeek = weekLetterFor(new Date(), settings.termStart);
  const [previewWeek, setPreviewWeek] = useState<WeekLetter>(actualWeek);

  const sorted = [...courses].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="screen">
      <span className="eyebrow">Cours récurrents</span>
      <h1 className="title-xl">Tes cours</h1>
      <p className="courses__intro">
        Un cours ajouté à la main garde le violet — la récurrence se lit dans
        une pastille, jamais dans une nouvelle couleur.
      </p>

      <WeekToggle active={previewWeek} onChange={setPreviewWeek} />

      {sorted.length === 0 ? (
        <div className="card courses__empty">
          Aucun cours pour l'instant. Ajoute ton premier cours ci-dessous.
        </div>
      ) : (
        <ul className="courses__list">
          {sorted.map((course) => {
            const badge = recurrenceBadge(course);
            const hidden = course.recurrence.type === "ab" && course.recurrence.week !== previewWeek;
            return (
              <li key={course.id}>
                <Link
                  to={`/cours/${course.id}`}
                  className={"courses__item" + (hidden ? " courses__item--free" : "")}
                >
                  <div className="courses__time">
                    {course.startTime}
                    <br />
                    <span className="courses__time-end">{course.endTime}</span>
                  </div>
                  <div className="courses__body">
                    <div className="courses__head">
                      <span className="courses__name">
                        {hidden ? "Tu es libre" : course.subject}
                      </span>
                      {!hidden && badge && (
                        <span className="courses__badge">{badge}</span>
                      )}
                      {hidden && (
                        <span className="courses__badge courses__badge--free">
                          SEM. {previewWeek}
                        </span>
                      )}
                    </div>
                    <div className="courses__meta">
                      {hidden
                        ? `Pas de ${course.subject.toLowerCase()} cette semaine`
                        : recurrenceSummary(course)}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
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
