import { describe, expect, it } from "vitest";
import { findNextCourse } from "./nextCourse";
import type { Course } from "./types";

const TERM_START = "2026-09-01"; // Tuesday

const maths: Course = {
  id: "1",
  subject: "Mathématiques",
  teacher: "",
  room: "",
  startTime: "08:30",
  endTime: "09:25",
  recurrence: { type: "weekly", weekday: 1 }, // mardi
};

const anglais: Course = {
  id: "2",
  subject: "Anglais",
  teacher: "",
  room: "",
  startTime: "14:00",
  endTime: "15:00",
  recurrence: { type: "weekly", weekday: 1 }, // mardi
};

describe("findNextCourse", () => {
  it("finds a later course happening today", () => {
    const now = new Date(2026, 8, 1, 10, 0); // Tuesday 10:00, after maths
    const result = findNextCourse([maths, anglais], now, TERM_START);
    expect(result?.course.id).toBe("2");
  });

  it("skips to the next occurrence once today's courses are done", () => {
    const now = new Date(2026, 8, 1, 16, 0); // Tuesday, after both courses
    const result = findNextCourse([maths, anglais], now, TERM_START);
    expect(result?.course.id).toBe("1"); // next Tuesday's maths
    expect(result?.date.getDate()).toBe(8);
  });

  it("returns null when there are no courses at all", () => {
    expect(findNextCourse([], new Date(2026, 8, 1, 8, 0), TERM_START)).toBeNull();
  });

  it("finds a course starting right now's minute as upcoming only if strictly after", () => {
    const now = new Date(2026, 8, 1, 8, 30); // exactly maths' start time
    const result = findNextCourse([maths], now, TERM_START);
    // Not "next" anymore — it has already started; the following occurrence is next Tuesday.
    expect(result?.date.getDate()).toBe(8);
  });
});
