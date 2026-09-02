export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = lundi ... 6 = dimanche
export type WeekLetter = "A" | "B";

export type Recurrence =
  | { type: "weekly"; weekday: Weekday }
  | { type: "ab"; weekday: Weekday; week: WeekLetter }
  | { type: "daily"; weekdays: Weekday[] }
  | { type: "monthly"; dayOfMonth: number }
  | { type: "once"; date: string }; // ISO yyyy-mm-dd

export interface Course {
  id: string;
  subject: string;
  teacher: string;
  room: string;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  recurrence: Recurrence;
}

export interface Homework {
  id: string;
  text: string;
  dueDate: string; // ISO yyyy-mm-dd
  courseId?: string;
  done: boolean;
}

export interface Settings {
  firstName: string | null;
  /** Monday of the first week of school, which is always a "semaine A". */
  termStart: string; // ISO yyyy-mm-dd
}

export interface AppData {
  settings: Settings;
  courses: Course[];
  homework: Homework[];
}
