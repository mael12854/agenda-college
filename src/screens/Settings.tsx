import { useState } from "react";
import { useStore } from "../lib/store";
import { ImportScheduleButton } from "../components/ImportScheduleButton";
import { IcalSyncPanel } from "../components/IcalSyncPanel";
import { ConfirmModal } from "../components/ConfirmModal";
import "./Settings.css";

export function Settings() {
  const { settings, courses, setFirstName, clearCourses } = useStore();
  const [name, setName] = useState(settings.firstName ?? "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleted, setDeleted] = useState(false);

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
        <span className="settings__label">Lien iCal EcoleDirecte</span>
        <IcalSyncPanel />
      </div>

      <div className="card settings__field">
        <span className="settings__label">Importer un JSON</span>
        <ImportScheduleButton />
      </div>

      <div className="settings__storage">
        <span className="eyebrow" style={{ color: "var(--color-homework)" }}>
          Stockage local
        </span>
        <p>
          Prénom, cours et devoirs vivent dans le stockage de ce navigateur,
          sur cet appareil. La synchronisation iCal passe par un relais
          technique qui ne fait que transmettre le calendrier — il ne stocke
          rien.
        </p>
      </div>

      <div className="settings__danger-zone">
        <button
          type="button"
          className="settings__danger-btn"
          onClick={() => setConfirmingDelete(true)}
          disabled={courses.length === 0}
        >
          Supprimer l'emploi du temps
        </button>
        {deleted && (
          <p className="settings__danger-feedback">Emploi du temps supprimé.</p>
        )}
      </div>

      {confirmingDelete && (
        <ConfirmModal
          title="Supprimer l'emploi du temps ?"
          message="Tout l'emploi du temps sera supprimé. Cette action est irréversible."
          confirmLabel="Supprimer"
          danger
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={() => {
            clearCourses();
            setConfirmingDelete(false);
            setDeleted(true);
          }}
        />
      )}
    </div>
  );
}
