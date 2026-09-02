import type { AppData, Course, Homework, Settings } from "./types";

// Keys match the "stockage local" note in the brand guidelines (screen 08):
// creno.prenom, creno.cours[], creno.recurrences[]. Recurrence lives
// embedded on each course rather than in a separate array — it's a
// property of the course, not an independent entity — but the namespacing
// and the "no server" contract are unchanged from the spec. The rentrée
// date isn't stored here: it's a fixed constant (TERM_START in
// lib/recurrence.ts), not a per-student setting.
const KEY_PRENOM = "creno.prenom";
const KEY_COURS = "creno.cours";
const KEY_DEVOIRS = "creno.devoirs";

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

export function loadData(): AppData {
  const settings: Settings = {
    firstName: read<string | null>(KEY_PRENOM, null),
  };
  const courses = read<Course[]>(KEY_COURS, []);
  const homework = read<Homework[]>(KEY_DEVOIRS, []);
  return { settings, courses, homework };
}

export function saveFirstName(name: string | null): void {
  if (name === null) localStorage.removeItem(KEY_PRENOM);
  else write(KEY_PRENOM, name);
}

export function saveCourses(courses: Course[]): void {
  write(KEY_COURS, courses);
}

export function saveHomework(homework: Homework[]): void {
  write(KEY_DEVOIRS, homework);
}
