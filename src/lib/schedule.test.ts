import { describe, expect, it } from "vitest";
import { buildDaySlots, passingLabel } from "./schedule";
import type { Course } from "./types";

function course(id: string, startTime: string, endTime: string): Course {
  return {
    id,
    subject: `Cours ${id}`,
    teacher: "",
    room: "",
    startTime,
    endTime,
    recurrence: { type: "weekly", weekday: 0 },
  };
}

describe("buildDaySlots", () => {
  it("never shows a gap before the first class of the day", () => {
    // First class starts well after SCHOOL_DAY_START (08:00) — there must
    // be no leading "Intercours"/"Pause"/free slot before it.
    const slots = buildDaySlots([course("a", "08:05", "08:55"), course("b", "10:10", "17:00")]);
    expect(slots[0]).toMatchObject({ kind: "course", course: { id: "a" } });
  });

  it("labels a 5-minute passing period as 'passing', not a heure de trou", () => {
    const slots = buildDaySlots([course("a", "08:05", "08:55"), course("b", "09:00", "17:00")]);
    const free = slots.filter((s) => s.kind === "free");
    const passing = slots.filter((s) => s.kind === "passing");
    expect(free).toHaveLength(0);
    expect(passing).toHaveLength(1);
    expect(passing[0]).toMatchObject({ startTime: "08:55", endTime: "09:00" });
  });

  it("treats a 15-minute récréation as 'passing', not free time", () => {
    // Isolates a single 15-minute gap (09:55-10:10).
    const slots = buildDaySlots([course("a", "08:00", "09:55"), course("b", "10:10", "17:00")]);
    const free = slots.filter((s) => s.kind === "free");
    const passing = slots.filter((s) => s.kind === "passing");
    expect(free).toHaveLength(0);
    expect(passing).toHaveLength(1);
    expect(passing[0]).toMatchObject({ startTime: "09:55", endTime: "10:10" });
  });

  it("still reports a real gap of 30 minutes or more as 'free'", () => {
    // Isolates a single 55-minute gap (09:55-10:50).
    const slots = buildDaySlots([course("a", "08:00", "09:55"), course("b", "10:50", "17:00")]);
    const free = slots.filter((s) => s.kind === "free");
    expect(free).toHaveLength(1);
    expect(free[0]).toMatchObject({ startTime: "09:55", endTime: "10:50" });
  });

  it("never shows a gap after the last class of the day", () => {
    // Last class ends well before SCHOOL_DAY_END (17:00) — there must be
    // no trailing "heure de trou" after it.
    const slots = buildDaySlots([course("a", "08:05", "08:55"), course("b", "10:10", "10:55")]);
    expect(slots.at(-1)).toMatchObject({ kind: "course", course: { id: "b" } });
  });

  it("shows the whole school day as free when there are no classes at all", () => {
    const slots = buildDaySlots([]);
    expect(slots).toEqual([{ kind: "free", startTime: "08:00", endTime: "17:00" }]);
  });

  it("never leaves a gap unaccounted for — every minute of the day is covered", () => {
    const slots = buildDaySlots([course("a", "08:05", "08:55"), course("b", "11:00", "11:50")]);
    for (let i = 0; i < slots.length - 1; i++) {
      const current = slots[i];
      const currentEnd = current.kind === "course" ? current.course.endTime : current.endTime;
      const next = slots[i + 1];
      const nextStart = next.kind === "course" ? next.course.startTime : next.startTime;
      expect(currentEnd).toBe(nextStart);
    }
  });
});

describe("passingLabel", () => {
  it("reads 'Intercours' for a short room-change gap", () => {
    expect(passingLabel("08:55", "09:00")).toBe("Intercours");
    expect(passingLabel("08:55", "09:05")).toBe("Intercours"); // exactly 10 min
  });

  it("reads 'Pause' for a récréation-sized gap", () => {
    expect(passingLabel("09:55", "10:10")).toBe("Pause"); // 15 min
    expect(passingLabel("09:55", "10:25")).toBe("Pause"); // 29 min, still under the free threshold
  });
});
