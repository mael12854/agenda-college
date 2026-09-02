import { useState } from "react";
import { useStore } from "../lib/store";
import "./Settings.css";

export function Settings() {
  const { settings, setFirstName, setTermStart } = useStore();
  const [name, setName] = useState(settings.firstName ?? "");
  const [termStart, setTermStartInput] = useState(settings.termStart);

  return (
    <div className="screen">
      <span className="eyebrow">Réglages</span>
      <h1 className="title-xl">Ton profil</h1>

      <div className="card settings__field">
        <label>
          <span className="settings__label">Prénom</span>
          <input
            className="course-form__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name.trim() && setFirstName(name.trim())}
          />
        </label>
      </div>

      <div className="card settings__field">
        <label>
          <span className="settings__label">
            Semaine de la rentrée (référence semaine A)
          </span>
          <input
            type="date"
            className="course-form__input"
            value={termStart}
            onChange={(e) => setTermStartInput(e.target.value)}
            onBlur={() => termStart && setTermStart(termStart)}
          />
        </label>
        <p className="settings__hint">
          La semaine de la rentrée est toujours une semaine A — l'alternance
          A/B se calcule à partir de cette date.
        </p>
      </div>

      <div className="settings__storage">
        <span className="eyebrow" style={{ color: "var(--color-homework)" }}>
          Stockage local · pas de serveur
        </span>
        <p>
          Prénom, cours, devoirs et semaine de référence vivent dans le
          stockage de ce navigateur, sur cet appareil.
        </p>
      </div>
    </div>
  );
}
