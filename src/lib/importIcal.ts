import type { ParsedImport } from "./importSchedule";
import type { Course } from "./types";

/**
 * Parses an iCal (RFC 5545) feed into Créno courses — the "subscribe by
 * URL" counterpart to parseImportedSchedule's JSON import. Returns the same
 * ParsedImport shape so both paths share store.importCourses' per-date
 * replace-not-duplicate logic.
 *
 * Field mapping is necessarily a best guess: ICS has no standard "teacher"
 * or "remplacé/contrôle" concept, and EcoleDirecte's actual feed hasn't
 * been seen yet. What IS standard and reliably mapped:
 *   SUMMARY     -> subject
 *   LOCATION    -> room
 *   DESCRIPTION -> note (shown on tap)
 *   STATUS:CANCELLED -> status "annule"
 * Everything else (teacher, "remplace"/"controle") is left unset — there's
 * no RFC-standard field for it, so guessing from free text would likely be
 * wrong. If EcoleDirecte's real feed encodes these in SUMMARY/DESCRIPTION
 * in a recognisable way, this is the function to extend once that's known.
 *
 * RRULE (recurring VEVENTs) is not expanded — only the event's own
 * DTSTART/DTEND is used. School timetable feeds with per-occurrence
 * substitutions/cancellations are generally flattened to one VEVENT per
 * actual occurrence (that's what EcoleDirecte's own JSON export does), so
 * this is expected to be a non-issue in practice, not a shortcut taken
 * for convenience — but it's untested against a real feed.
 */
export function parseIcalSchedule(ics: string): ParsedImport {
  if (!/BEGIN:VCALENDAR/i.test(ics)) {
    throw new Error("Ce fichier ne ressemble pas à un calendrier iCal (.ics).");
  }

  const lines = unfold(ics);
  const events = splitEvents(lines);
  if (events.length === 0) {
    throw new Error("Aucun événement trouvé dans ce calendrier.");
  }

  const courses: Course[] = [];
  const dateSet = new Set<string>();

  for (const eventLines of events) {
    const props = parseProperties(eventLines);
    const dtstart = props.get("DTSTART");
    const dtend = props.get("DTEND");
    const summary = props.get("SUMMARY");
    if (!dtstart || !summary) continue; // not a usable timed event

    const start = parseDateTime(dtstart);
    if (!start || start.allDay) continue; // a timetable slot always has a time

    const end = dtend ? parseDateTime(dtend) : null;

    const location = props.get("LOCATION");
    const description = props.get("DESCRIPTION");
    const status = props.get("STATUS");

    dateSet.add(start.date);
    courses.push({
      id: crypto.randomUUID(),
      subject: unescapeText(summary.value),
      teacher: "",
      room: location ? unescapeText(location.value) : "",
      startTime: start.time,
      endTime: end && !end.allDay ? end.time : start.time,
      recurrence: { type: "once", date: start.date },
      status: status?.value.toUpperCase() === "CANCELLED" ? "annule" : "normal",
      note: description ? unescapeText(description.value) : undefined,
    });
  }

  return { courses, dates: [...dateSet].sort() };
}

// --- RFC 5545 plumbing -----------------------------------------------

/** Unfolds CRLF-plus-leading-whitespace continuation lines into single logical lines. */
function unfold(ics: string): string[] {
  const raw = ics.split(/\r\n|\n|\r/);
  const lines: string[] = [];
  for (const line of raw) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }
  return lines;
}

function splitEvents(lines: string[]): string[][] {
  const events: string[][] = [];
  let current: string[] | null = null;
  for (const line of lines) {
    if (/^BEGIN:VEVENT/i.test(line)) {
      current = [];
    } else if (/^END:VEVENT/i.test(line)) {
      if (current) events.push(current);
      current = null;
    } else if (current) {
      current.push(line);
    }
  }
  return events;
}

interface Prop {
  params: Record<string, string>;
  value: string;
}

/** One VEVENT's properties, keyed by name (last occurrence wins, as ICS allows repeats only for a few props we don't use). */
function parseProperties(lines: string[]): Map<string, Prop> {
  const props = new Map<string, Prop>();
  for (const line of lines) {
    if (!line.trim()) continue;
    const match = /^([A-Z0-9-]+)((?:;[^:]*)?):(.*)$/i.exec(line);
    if (!match) continue;
    const [, name, paramsRaw, value] = match;
    const params: Record<string, string> = {};
    for (const part of paramsRaw.split(";")) {
      const [k, v] = part.split("=");
      if (k && v !== undefined) params[k.toUpperCase()] = v;
    }
    props.set(name.toUpperCase(), { params, value });
  }
  return props;
}

interface ParsedDateTime {
  date: string; // ISO yyyy-mm-dd
  time: string; // "HH:MM", local wall-clock
  allDay: boolean;
}

/**
 * Converts a DTSTART/DTEND property into a local (Europe/Paris) date + wall-clock time.
 * Handles the three shapes a timetable feed can use:
 *   VALUE=DATE:20261123                (all-day — not a class slot, skipped by the caller)
 *   TZID=Europe/Paris:20261123T090000  (already local wall-clock — used as-is)
 *   20261123T090000Z                   (UTC — converted to Europe/Paris)
 */
function parseDateTime(prop: Prop): ParsedDateTime | null {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(prop.value);
  if (!m) return null;
  const [, y, mo, d, hh, mm, ss, zulu] = m;

  if (hh === undefined || prop.params.VALUE === "DATE") {
    return { date: `${y}-${mo}-${d}`, time: "00:00", allDay: true };
  }

  if (zulu) {
    const utc = new Date(Date.UTC(+y, +mo - 1, +d, +hh, +mm, +(ss ?? "0")));
    const parts = new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Paris",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(utc);
    const get = (type: string) => parts.find((p) => p.type === type)!.value;
    return {
      date: `${get("year")}-${get("month")}-${get("day")}`,
      time: `${get("hour")}:${get("minute")}`,
      allDay: false,
    };
  }

  // Floating local time, or an explicit TZID — both are already the wall-clock time we want.
  return { date: `${y}-${mo}-${d}`, time: `${hh}:${mm}`, allDay: false };
}

function unescapeText(s: string): string {
  return s
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}
