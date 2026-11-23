export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = lundi ... 6 = dimanche
export type WeekLetter = "A" | "B";

export type Recurrence =
  | { type: "weekly"; weekday: Weekday }
  | { type: "ab"; weekday: Weekday; week: WeekLetter }
  | { type: "daily"; weekdays: Weekday[] }
  | { type: "monthly"; dayOfMonth: number }
  | { type: "once"; date: string }; // ISO yyyy-mm-dd

/** "normal" when absent — most courses never set this field at all. */
export type CourseStatus = "normal" | "remplace" | "controle" | "annule";

export interface Course {
  id: string;
  subject: string;
  teacher: string;
  room: string;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  recurrence: Recurrence;
  /** Defaults to "normal" when absent. */
  status?: CourseStatus;
  /** The usual teacher, when `teacher` is standing in for them (a "remplace"/"controle" course). */
  substituteFor?: string;
  /** Free-text detail shown when the course is tapped (e.g. why a class was cancelled). */
  note?: string;
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
}

export interface AppData {
  settings: Settings;
  courses: Course[];
  homework: Homework[];
}
