import type { Weekday } from "./types";

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** JS getDay() is 0=dimanche..6=samedi; we use 0=lundi..6=dimanche. */
export function toWeekday(d: Date): Weekday {
  return ((d.getDay() + 6) % 7) as Weekday;
}

export function mondayOf(d: Date): Date {
  const wd = toWeekday(d);
  const monday = new Date(d);
  monday.setDate(d.getDate() - wd);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

const WEEKDAY_LABELS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

export function weekdayLabel(wd: Weekday): string {
  return WEEKDAY_LABELS[wd];
}

export function formatDayHeading(d: Date): string {
  const label = WEEKDAY_LABELS[toWeekday(d)];
  return `${label} ${d.getDate()}`;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${String(m).padStart(2, "0")}`;
}

export function isSameDate(a: Date, b: Date): boolean {
  return toISODate(a) === toISODate(b);
}
