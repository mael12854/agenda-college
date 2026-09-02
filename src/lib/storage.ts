import type { AppData, Course, Homework, Settings } from "./types";
import { toISODate, mondayOf } from "./date";

// Keys match the "stockage local" note in the brand guidelines (screen 08):
// creno.prenom, creno.cours[], creno.recurrences[], creno.rentree.
// Recurrence lives embedded on each course rather than in a separate array —
// it's a property of the course, not an independent entity — but the
// namespacing and the "no server" contract are unchanged from the spec.
const KEY_PRENOM = "creno.prenom";
const KEY_COURS = "creno.cours";
const KEY_DEVOIRS = "creno.devoirs";
const KEY_RENTREE = "creno.rentree";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function defaultTermStart(): string {
  // Best guess until the student confirms it in Réglages: the Monday of the
  // current week, which the guidelines treat as "semaine A" by definition.
  return toISODate(mondayOf(new Date()));
}

export function loadData(): AppData {
  const settings: Settings = {
    firstName: read<string | null>(KEY_PRENOM, null),
    termStart: read<string>(KEY_RENTREE, defaultTermStart()),
  };
  const courses = read<Course[]>(KEY_COURS, []);
  const homework = read<Homework[]>(KEY_DEVOIRS, []);
  return { settings, courses, homework };
}

export function saveFirstName(name: string | null): void {
  if (name === null) localStorage.removeItem(KEY_PRENOM);
  else write(KEY_PRENOM, name);
}

export function saveTermStart(iso: string): void {
  write(KEY_RENTREE, iso);
}

export function saveCourses(courses: Course[]): void {
  write(KEY_COURS, courses);
}

export function saveHomework(homework: Homework[]): void {
  write(KEY_DEVOIRS, homework);
}
