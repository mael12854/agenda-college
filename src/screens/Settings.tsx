import { useState } from "react";
import { useStore } from "../lib/store";
import "./Settings.css";

export function Settings() {
  const { settings, setFirstName } = useStore();
  const [name, setName] = useState(settings.firstName ?? "");

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

      <div className="settings__storage">
        <span className="eyebrow" style={{ color: "var(--color-homework)" }}>
          Stockage local · pas de serveur
        </span>
        <p>
          Prénom, cours et devoirs vivent dans le stockage de ce navigateur,
          sur cet appareil.
        </p>
      </div>
    </div>
  );
}
