import type { Course, CourseStatus } from "./types";

/**
 * Shape produced by the EcoleDirecte week export this app knows how to read:
 * `jours[]`, each with `date` + `cours[]` ("debut", "fin", "matiere", "prof",
 * optional "prof_habituel"/"statut"/"info"). `trous[]` is read but ignored —
 * Créno already derives heures de trou from the courses themselves
 * (buildDaySlots), so storing the source's own gap list would just be a
 * second, divergent source of truth.
 */
interface RawCours {
  debut: string;
  fin: string;
  matiere: string;
  prof?: string | null;
  prof_habituel?: string | null;
  statut?: string | null;
  info?: string | null;
}
interface RawJour {
  date: string;
  cours?: RawCours[];
}
interface RawSemaine {
  jours?: RawJour[];
}

const VALID_STATUSES: CourseStatus[] = ["normal", "remplace", "controle", "annule"];

function newId(): string {
  return crypto.randomUUID();
}

export interface ParsedImport {
  courses: Course[];
  /** ISO dates covered by the import — used to replace any previous import of the same days. */
  dates: string[];
}

/**
 * Parses an uploaded EcoleDirecte-style week export into Créno courses.
 * Throws a (French, user-facing) Error on anything that doesn't look like
 * the expected shape, rather than silently importing partial data.
 */
export function parseImportedSchedule(raw: unknown): ParsedImport {
  if (typeof raw !== "object" || raw === null || !Array.isArray((raw as RawSemaine).jours)) {
    throw new Error('Format JSON invalide : "jours" doit être une liste.');
  }

  const jours = (raw as RawSemaine).jours!;
  const courses: Course[] = [];
  const dates: string[] = [];

  for (const jour of jours) {
    if (typeof jour.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(jour.date)) {
      throw new Error(`Date invalide dans le JSON : ${JSON.stringify(jour.date)}.`);
    }
    dates.push(jour.date);

    for (const c of jour.cours ?? []) {
      if (typeof c.debut !== "string" || typeof c.fin !== "string" || typeof c.matiere !== "string") {
        throw new Error(`Cours incomplet le ${jour.date} : "debut", "fin" et "matiere" sont requis.`);
      }
      const statut = c.statut ?? "normal";
      if (!VALID_STATUSES.includes(statut as CourseStatus)) {
        throw new Error(`Statut inconnu le ${jour.date} pour "${c.matiere}" : "${statut}".`);
      }

      courses.push({
        id: newId(),
        subject: c.matiere,
        teacher: c.prof ?? "",
        room: "",
        startTime: c.debut,
        endTime: c.fin,
        recurrence: { type: "once", date: jour.date },
        status: statut as CourseStatus,
        substituteFor: c.prof_habituel ?? undefined,
        note: c.info ?? undefined,
      });
    }
  }

  return { courses, dates };
}
