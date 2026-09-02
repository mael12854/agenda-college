import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useStore } from "../lib/store";
import type { Recurrence, Weekday } from "../lib/types";
import { weekdayLabel } from "../lib/date";
import "./CourseForm.css";

const WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];
const SCHOOL_WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4];

const RECURRENCE_OPTIONS: { type: Recurrence["type"]; label: string; hint: string }[] = [
  { type: "weekly", label: "↻ Chaque sem.", hint: "Le cas par défaut" },
  { type: "ab", label: "↻ Sem. A / B", hint: "Une semaine sur deux" },
  { type: "daily", label: "↻ Chaque jour", hint: "Tous les jours d'école" },
  { type: "monthly", label: "↻ 1× / mois", hint: "Un jour précis du mois" },
  { type: "once", label: "Ponctuel", hint: "Une seule fois" },
];

function newId(): string {
  return crypto.randomUUID();
}

export function CourseForm() {
  const { courses, addCourse, updateCourse, removeCourse } = useStore();
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = useMemo(() => courses.find((c) => c.id === id), [courses, id]);

  const [subject, setSubject] = useState(editing?.subject ?? "");
  const [teacher, setTeacher] = useState(editing?.teacher ?? "");
  const [room, setRoom] = useState(editing?.room ?? "");
  const [startTime, setStartTime] = useState(editing?.startTime ?? "08:30");
  const [endTime, setEndTime] = useState(editing?.endTime ?? "09:25");

  const [recurrenceType, setRecurrenceType] = useState<Recurrence["type"]>(
    editing?.recurrence.type ?? "weekly",
  );
  const [weekday, setWeekday] = useState<Weekday>(
    editing?.recurrence.type === "weekly" || editing?.recurrence.type === "ab"
      ? editing.recurrence.weekday
      : 0,
  );
  const [abWeek, setAbWeek] = useState<"A" | "B">(
    editing?.recurrence.type === "ab" ? editing.recurrence.week : "A",
  );
  const [dailyWeekdays, setDailyWeekdays] = useState<Weekday[]>(
    editing?.recurrence.type === "daily" ? editing.recurrence.weekdays : SCHOOL_WEEKDAYS,
  );
  const [dayOfMonth, setDayOfMonth] = useState<number>(
    editing?.recurrence.type === "monthly" ? editing.recurrence.dayOfMonth : 1,
  );
  const [onceDate, setOnceDate] = useState<string>(
    editing?.recurrence.type === "once" ? editing.recurrence.date : "",
  );

  function buildRecurrence(): Recurrence {
    switch (recurrenceType) {
      case "weekly":
        return { type: "weekly", weekday };
      case "ab":
        return { type: "ab", weekday, week: abWeek };
      case "daily":
        return { type: "daily", weekdays: dailyWeekdays };
      case "monthly":
        return { type: "monthly", dayOfMonth };
      case "once":
        return { type: "once", date: onceDate };
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !startTime || !endTime) return;
    if (recurrenceType === "once" && !onceDate) return;

    const course = {
      id: editing?.id ?? newId(),
      subject: subject.trim(),
      teacher: teacher.trim(),
      room: room.trim(),
      startTime,
      endTime,
      recurrence: buildRecurrence(),
    };

    if (editing) updateCourse(course);
    else addCourse(course);
    navigate("/cours");
  }

  function handleDelete() {
    if (!editing) return;
    removeCourse(editing.id);
    navigate("/cours");
  }

  return (
    <form className="screen course-form" onSubmit={submit}>
      <span className="eyebrow">{editing ? "Modifier le cours" : "Ajouter un cours"}</span>
      <h1 className="title-xl">{editing ? editing.subject : "Nouveau cours"}</h1>

      <label className="course-form__field">
        <span>Matière</span>
        <input
          className="text-input"
          style={{ fontSize: 18 }}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Mathématiques"
          required
        />
      </label>

      <div className="course-form__row">
        <label className="course-form__field">
          <span>Professeur·e</span>
          <input
            className="course-form__input"
            value={teacher}
            onChange={(e) => setTeacher(e.target.value)}
            placeholder="M. Rivière"
          />
        </label>
        <label className="course-form__field">
          <span>Salle</span>
          <input
            className="course-form__input"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="214"
          />
        </label>
      </div>

      <div className="course-form__row">
        <label className="course-form__field">
          <span>Début</span>
          <input
            type="time"
            className="course-form__input"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </label>
        <label className="course-form__field">
          <span>Fin</span>
          <input
            type="time"
            className="course-form__input"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </label>
      </div>

      <span className="course-form__section-label">Récurrence</span>
      <div className="course-form__recurrence-grid">
        {RECURRENCE_OPTIONS.map((opt) => (
          <button
            type="button"
            key={opt.type}
            className={
              "course-form__recurrence-card" +
              (recurrenceType === opt.type ? " course-form__recurrence-card--active" : "")
            }
            onClick={() => setRecurrenceType(opt.type)}
          >
            <span className="course-form__recurrence-title">{opt.label}</span>
            <span className="course-form__recurrence-hint">{opt.hint}</span>
          </button>
        ))}
      </div>

      {(recurrenceType === "weekly" || recurrenceType === "ab") && (
        <label className="course-form__field">
          <span>Jour</span>
          <select
            className="course-form__input"
            value={weekday}
            onChange={(e) => setWeekday(Number(e.target.value) as Weekday)}
          >
            {WEEKDAYS.map((wd) => (
              <option key={wd} value={wd}>
                {weekdayLabel(wd)}
              </option>
            ))}
          </select>
        </label>
      )}

      {recurrenceType === "ab" && (
        <label className="course-form__field">
          <span>A lieu en semaine</span>
          <div className="course-form__ab">
            {(["A", "B"] as const).map((w) => (
              <button
                type="button"
                key={w}
                className={
                  "course-form__ab-btn" + (abWeek === w ? " course-form__ab-btn--active" : "")
                }
                onClick={() => setAbWeek(w)}
              >
                Semaine {w}
              </button>
            ))}
          </div>
        </label>
      )}

      {recurrenceType === "daily" && (
        <label className="course-form__field">
          <span>Jours concernés</span>
          <div className="course-form__weekday-picker">
            {WEEKDAYS.map((wd) => (
              <button
                type="button"
                key={wd}
                className={
                  "course-form__weekday-btn" +
                  (dailyWeekdays.includes(wd) ? " course-form__weekday-btn--active" : "")
                }
                onClick={() =>
                  setDailyWeekdays((prev) =>
                    prev.includes(wd) ? prev.filter((d) => d !== wd) : [...prev, wd].sort(),
                  )
                }
              >
                {weekdayLabel(wd).slice(0, 2)}
              </button>
            ))}
          </div>
        </label>
      )}

      {recurrenceType === "monthly" && (
        <label className="course-form__field">
          <span>Jour du mois</span>
          <input
            type="number"
            min={1}
            max={31}
            className="course-form__input"
            value={dayOfMonth}
            onChange={(e) => setDayOfMonth(Number(e.target.value))}
          />
        </label>
      )}

      {recurrenceType === "once" && (
        <label className="course-form__field">
          <span>Date</span>
          <input
            type="date"
            className="course-form__input"
            value={onceDate}
            onChange={(e) => setOnceDate(e.target.value)}
            required
          />
        </label>
      )}

      {recurrenceType === "ab" && (
        <div className="course-form__note">
          <strong>Référence&nbsp;:</strong> la semaine de la rentrée est une
          semaine A — modifiable dans Réglages si besoin.
        </div>
      )}

      <div className="course-form__actions">
        <button type="submit" className="button-primary">
          {editing ? "Enregistrer" : "Ajouter le cours"}
        </button>
        {editing && (
          <button type="button" className="button-ghost" onClick={handleDelete}>
            Supprimer
          </button>
        )}
      </div>
    </form>
  );
}
