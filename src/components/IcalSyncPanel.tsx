import { useState } from "react";
import { useStore } from "../lib/store";
import { parseIcalSchedule } from "../lib/importIcal";
import "./IcalSyncPanel.css";

function maskUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname}/···`;
  } catch {
    return "···";
  }
}

export function IcalSyncPanel() {
  const { settings, importCourses, setIcalUrl } = useStore();
  const [input, setInput] = useState(settings.icalUrl ?? "");
  const [syncing, setSyncing] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  async function sync(url: string) {
    setSyncing(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/ics-proxy?url=${encodeURIComponent(url)}`);
      const body = await res.text();
      if (!res.ok) {
        let message = `Échec de la synchronisation (${res.status}).`;
        try {
          message = (JSON.parse(body) as { error?: string }).error ?? message;
        } catch {
          /* non-JSON error body — keep the generic message */
        }
        throw new Error(message);
      }
      const { courses, dates } = parseIcalSchedule(body);
      importCourses(courses, dates);
      setIcalUrl(url);
      setFeedback({
        ok: true,
        text:
          courses.length > 0
            ? `${courses.length} cours synchronisé${courses.length > 1 ? "s" : ""} sur ${dates.length} jour${dates.length > 1 ? "s" : ""}.`
            : "Calendrier synchronisé, mais aucun cours dedans.",
      });
    } catch (err) {
      setFeedback({
        ok: false,
        text: err instanceof Error ? err.message : "Lien illisible — vérifie qu'il pointe bien vers un .ics.",
      });
    } finally {
      setSyncing(false);
    }
  }

  function forget() {
    setIcalUrl(null);
    setInput("");
    setFeedback(null);
  }

  return (
    <div className="ical-sync">
      {settings.icalUrl ? (
        <>
          <span className="ical-sync__saved">{maskUrl(settings.icalUrl)}</span>
          <div className="ical-sync__row">
            <button
              type="button"
              className="ical-sync__btn"
              disabled={syncing}
              onClick={() => sync(settings.icalUrl!)}
            >
              {syncing ? "Synchronisation…" : "Resynchroniser"}
            </button>
            <button type="button" className="ical-sync__forget" onClick={forget}>
              Oublier ce lien
            </button>
          </div>
        </>
      ) : (
        <form
          className="ical-sync__row"
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) sync(input.trim());
          }}
        >
          <input
            className="course-form__input ical-sync__input"
            type="url"
            inputMode="url"
            placeholder="https://www.ecoledirecte.com/…/agenda.ics"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="ical-sync__btn" disabled={syncing || !input.trim()}>
            {syncing ? "…" : "Synchroniser"}
          </button>
        </form>
      )}
      <p className="ical-sync__hint">
        Le lien reste uniquement sur ce téléphone, comme le reste de tes données.
      </p>
      {feedback && (
        <p className={"ical-sync__feedback" + (feedback.ok ? "" : " ical-sync__feedback--error")}>
          {feedback.text}
        </p>
      )}
    </div>
  );
}
