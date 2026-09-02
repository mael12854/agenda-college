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
  it("does not treat a 5-minute passing period as a heure de trou", () => {
    // Spans the rest of the school day after 09:00, so the only candidate
    // gaps are the leading (08:00-08:05) and mid (08:55-09:00) 5-min ones.
    const slots = buildDaySlots([course("a", "08:05", "08:55"), course("b", "09:00", "17:00")]);
    const free = slots.filter((s) => s.kind === "free");
    expect(free).toHaveLength(0);
  });

  it("still reports a real gap of 15 minutes or more", () => {
    // Spans the whole school day except the 09:55-11:00 gap, isolating it
    // (no leading/trailing gap to confuse the assertion).
    const slots = buildDaySlots([course("a", "08:00", "09:55"), course("b", "11:00", "17:00")]);
    const free = slots.filter((s) => s.kind === "free");
    expect(free).toHaveLength(1);
    expect(free[0]).toMatchObject({ startTime: "09:55", endTime: "11:00" });
  });

  it("drops a short trailing gap at the end of the school day", () => {
    // Spans the whole school day except the last 5 minutes, isolating the
    // trailing gap (no leading/mid gap to confuse the assertion).
    const slots = buildDaySlots([course("a", "08:00", "16:55")]);
    expect(slots.some((s) => s.kind === "free")).toBe(false);
  });
});
