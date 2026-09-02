import type { WeekLetter } from "../lib/types";
import "./WeekToggle.css";

export function WeekToggle({
  active,
  onChange,
}: {
  active: WeekLetter;
  onChange: (w: WeekLetter) => void;
}) {
  return (
    <div className="week-card">
      <div className="week-card__label">
        <span className="week-card__eyebrow">CETTE SEMAINE</span>
        <span className="week-card__value">Semaine {active}</span>
      </div>
      <div className="week-toggle" role="group" aria-label="Semaine A ou B">
        {(["A", "B"] as const).map((w) => (
          <button
            key={w}
            type="button"
            className={
              "week-toggle__btn" +
              (w === active ? " week-toggle__btn--active" : "")
            }
            onClick={() => onChange(w)}
          >
            {w}
          </button>
        ))}
      </div>
    </div>
  );
}
