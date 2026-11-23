import { useRef, useState } from "react";
import { useStore } from "../lib/store";
import { parseImportedSchedule } from "../lib/importSchedule";
import "./ImportScheduleButton.css";

export function ImportScheduleButton({ label = "Importer un JSON" }: { label?: string }) {
  const { importCourses } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file next time
    if (!file) return;

    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      const { courses, dates } = parseImportedSchedule(raw);
      importCourses(courses, dates);
      setFeedback({
        ok: true,
        text:
          courses.length > 0
            ? `${courses.length} cours importé${courses.length > 1 ? "s" : ""} sur ${dates.length} jour${dates.length > 1 ? "s" : ""}.`
            : "Semaine importée, mais aucun cours dedans.",
      });
    } catch (err) {
      setFeedback({
        ok: false,
        text: err instanceof Error ? err.message : "Fichier illisible — vérifie que c'est bien un JSON.",
      });
    }
  }

  return (
    <div className="import-schedule">
      <button
        type="button"
        className="import-schedule__btn"
        onClick={() => inputRef.current?.click()}
      >
        {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleFile}
        hidden
      />
      {feedback && (
        <p className={"import-schedule__feedback" + (feedback.ok ? "" : " import-schedule__feedback--error")}>
          {feedback.text}
        </p>
      )}
    </div>
  );
}
