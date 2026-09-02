import { useState } from "react";
import { useStore } from "../lib/store";
import "./Homework.css";

function newId(): string {
  return crypto.randomUUID();
}

export function Homework() {
  const { homework, courses, addHomework, toggleHomework, removeHomework } = useStore();
  const [text, setText] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [courseId, setCourseId] = useState("");

  const pending = homework.filter((h) => !h.done).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const done = homework.filter((h) => h.done);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !dueDate) return;
    addHomework({
      id: newId(),
      text: text.trim(),
      dueDate,
      courseId: courseId || undefined,
      done: false,
    });
    setText("");
    setDueDate("");
    setCourseId("");
  }

  return (
    <div className="screen">
      <span className="eyebrow">Devoirs</span>
      <h1 className="title-xl">À rendre</h1>

      <form className="card homework__form" onSubmit={submit}>
        <input
          className="course-form__input"
          placeholder="Ex. Exercices p. 42"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="homework__form-row">
          <input
            type="date"
            className="course-form__input"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <select
            className="course-form__input"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          >
            <option value="">Matière (optionnel)</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.subject}
              </option>
            ))}
          </select>
        </div>
        <button className="button-primary" type="submit" disabled={!text.trim() || !dueDate}>
          Ajouter
        </button>
      </form>

      {pending.length === 0 && done.length === 0 && (
        <div className="card homework__empty">Aucun devoir pour l'instant.</div>
      )}

      {pending.length > 0 && (
        <ul className="homework__list">
          {pending.map((h) => (
            <li key={h.id} className="homework__item">
              <button
                type="button"
                className="homework__check"
                onClick={() => toggleHomework(h.id)}
                aria-label="Marquer comme fait"
              />
              <div className="homework__body">
                <div className="homework__text">{h.text}</div>
                <div className="homework__due">à rendre le {h.dueDate}</div>
              </div>
              <button
                type="button"
                className="homework__remove"
                onClick={() => removeHomework(h.id)}
                aria-label="Supprimer"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {done.length > 0 && (
        <>
          <span className="eyebrow">Fait</span>
          <ul className="homework__list homework__list--done">
            {done.map((h) => (
              <li key={h.id} className="homework__item homework__item--done">
                <button
                  type="button"
                  className="homework__check homework__check--done"
                  onClick={() => toggleHomework(h.id)}
                  aria-label="Marquer comme à faire"
                >
                  ✓
                </button>
                <div className="homework__body">
                  <div className="homework__text">{h.text}</div>
                </div>
                <button
                  type="button"
                  className="homework__remove"
                  onClick={() => removeHomework(h.id)}
                  aria-label="Supprimer"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
