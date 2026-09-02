import { describe, expect, it } from "vitest";
import { buildDaySlots } from "./schedule";
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
  it("labels a 5-minute passing period as 'passing', not a heure de trou", () => {
    // Spans the rest of the school day after 09:00, so the only candidate
    // gaps are the leading (08:00-08:05) and mid (08:55-09:00) 5-min ones.
    const slots = buildDaySlots([course("a", "08:05", "08:55"), course("b", "09:00", "17:00")]);
    const free = slots.filter((s) => s.kind === "free");
    const passing = slots.filter((s) => s.kind === "passing");
    expect(free).toHaveLength(0);
    expect(passing).toHaveLength(2);
    expect(passing[0]).toMatchObject({ startTime: "08:00", endTime: "08:05" });
    expect(passing[1]).toMatchObject({ startTime: "08:55", endTime: "09:00" });
  });

  it("still reports a real gap of 15 minutes or more as 'free'", () => {
    // Spans the whole school day except the 09:55-11:00 gap, isolating it
    // (no leading/trailing gap to confuse the assertion).
    const slots = buildDaySlots([course("a", "08:00", "09:55"), course("b", "11:00", "17:00")]);
    const free = slots.filter((s) => s.kind === "free");
    expect(free).toHaveLength(1);
    expect(free[0]).toMatchObject({ startTime: "09:55", endTime: "11:00" });
  });

  it("labels a short trailing gap at the end of the school day as 'passing'", () => {
    // Spans the whole school day except the last 5 minutes, isolating the
    // trailing gap (no leading/mid gap to confuse the assertion).
    const slots = buildDaySlots([course("a", "08:00", "16:55")]);
    const trailing = slots.at(-1);
    expect(trailing).toMatchObject({ kind: "passing", startTime: "16:55", endTime: "17:00" });
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
