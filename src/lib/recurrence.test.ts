import { describe, expect, it } from "vitest";
import { occursOn, weekLetterFor } from "./recurrence";
import type { Course } from "./types";

const TERM_START = "2026-09-01"; // a Tuesday; its Monday (08-31) is "semaine A"

describe("weekLetterFor", () => {
  it("marks the term-start week as A", () => {
    expect(weekLetterFor(new Date(2026, 8, 1), TERM_START)).toBe("A");
    expect(weekLetterFor(new Date(2026, 8, 4), TERM_START)).toBe("A"); // same week, Friday
  });

  it("alternates the following week to B", () => {
    expect(weekLetterFor(new Date(2026, 8, 7), TERM_START)).toBe("B"); // next Monday
  });

  it("alternates back to A two weeks later", () => {
    expect(weekLetterFor(new Date(2026, 8, 14), TERM_START)).toBe("A");
  });

  it("handles dates before the term start", () => {
    expect(weekLetterFor(new Date(2026, 7, 24), TERM_START)).toBe("B"); // week before
  });
});

describe("occursOn", () => {
  const weeklyCourse: Course = {
    id: "1",
    subject: "Maths",
    teacher: "",
    room: "",
    startTime: "08:30",
    endTime: "09:25",
    recurrence: { type: "weekly", weekday: 1 }, // mardi
  };

  it("weekly course occurs every matching weekday", () => {
    expect(occursOn(weeklyCourse, new Date(2026, 8, 1), TERM_START)).toBe(true); // Tue
    expect(occursOn(weeklyCourse, new Date(2026, 8, 8), TERM_START)).toBe(true); // Tue next week
    expect(occursOn(weeklyCourse, new Date(2026, 8, 2), TERM_START)).toBe(false); // Wed
  });

  const abCourse: Course = {
    id: "2",
    subject: "SVT · TP",
    teacher: "",
    room: "",
    startTime: "14:30",
    endTime: "16:25",
    recurrence: { type: "ab", weekday: 1, week: "A" }, // mardi, semaine A
  };

  it("ab course only occurs on its week letter", () => {
    expect(occursOn(abCourse, new Date(2026, 8, 1), TERM_START)).toBe(true); // Tue, week A
    expect(occursOn(abCourse, new Date(2026, 8, 8), TERM_START)).toBe(false); // Tue, week B
    expect(occursOn(abCourse, new Date(2026, 8, 15), TERM_START)).toBe(true); // Tue, week A again
  });

  const dailyCourse: Course = {
    id: "3",
    subject: "Étude",
    teacher: "",
    room: "",
    startTime: "17:00",
    endTime: "18:00",
    recurrence: { type: "daily", weekdays: [0, 1, 2, 3, 4] },
  };

  it("daily course occurs on all listed weekdays", () => {
    expect(occursOn(dailyCourse, new Date(2026, 8, 1), TERM_START)).toBe(true); // Tue
    expect(occursOn(dailyCourse, new Date(2026, 8, 5), TERM_START)).toBe(false); // Sat
  });

  const monthlyCourse: Course = {
    id: "4",
    subject: "Club",
    teacher: "",
    room: "",
    startTime: "12:00",
    endTime: "13:00",
    recurrence: { type: "monthly", dayOfMonth: 15 },
  };

  it("monthly course occurs on the given day of every month", () => {
    expect(occursOn(monthlyCourse, new Date(2026, 8, 15), TERM_START)).toBe(true);
    expect(occursOn(monthlyCourse, new Date(2026, 9, 15), TERM_START)).toBe(true);
    expect(occursOn(monthlyCourse, new Date(2026, 8, 16), TERM_START)).toBe(false);
  });

  const onceCourse: Course = {
    id: "5",
    subject: "Sortie",
    teacher: "",
    room: "",
    startTime: "09:00",
    endTime: "17:00",
    recurrence: { type: "once", date: "2026-10-02" },
  };

  it("once course only occurs on its exact date", () => {
    expect(occursOn(onceCourse, new Date(2026, 9, 2), TERM_START)).toBe(true);
    expect(occursOn(onceCourse, new Date(2026, 9, 9), TERM_START)).toBe(false);
  });
});
