import { describe, expect, it } from "vitest";
import { parseImportedSchedule } from "./importSchedule";

describe("parseImportedSchedule", () => {
  it("maps a well-formed week export into one-off courses", () => {
    const { courses, dates } = parseImportedSchedule({
      semaine: "2026-11-23",
      jours: [
        {
          date: "2026-11-23",
          jour: "lundi",
          cours: [
            {
              debut: "09:00",
              fin: "10:00",
              matiere: "Mathématiques",
              prof: "Mme Planchet",
              statut: "normal",
              info: null,
            },
            {
              debut: "11:00",
              fin: "12:00",
              matiere: "Physique-Chimie",
              prof: "Photopoulos",
              statut: "remplace",
              info: "Mme Genet remplacée par Photopoulos",
              prof_habituel: "Mme Genet",
            },
          ],
          trous: [],
        },
      ],
    });

    expect(dates).toEqual(["2026-11-23"]);
    expect(courses).toHaveLength(2);
    expect(courses[0]).toMatchObject({
      subject: "Mathématiques",
      teacher: "Mme Planchet",
      startTime: "09:00",
      endTime: "10:00",
      status: "normal",
      recurrence: { type: "once", date: "2026-11-23" },
    });
    expect(courses[1]).toMatchObject({
      subject: "Physique-Chimie",
      teacher: "Photopoulos",
      status: "remplace",
      substituteFor: "Mme Genet",
      note: "Mme Genet remplacée par Photopoulos",
    });
  });

  it("defaults a course with no statut to normal", () => {
    const { courses } = parseImportedSchedule({
      jours: [{ date: "2026-11-24", cours: [{ debut: "08:00", fin: "09:00", matiere: "Sciences" }] }],
    });
    expect(courses[0].status).toBe("normal");
    expect(courses[0].teacher).toBe("");
  });

  it("collects every day's date even when a day has no courses", () => {
    const { dates, courses } = parseImportedSchedule({
      jours: [
        { date: "2026-11-28", cours: [] },
        { date: "2026-11-29", cours: [] },
      ],
    });
    expect(dates).toEqual(["2026-11-28", "2026-11-29"]);
    expect(courses).toEqual([]);
  });

  it("rejects a payload without a jours array", () => {
    expect(() => parseImportedSchedule({ semaine: "2026-11-23" })).toThrow(/jours/);
    expect(() => parseImportedSchedule(null)).toThrow();
    expect(() => parseImportedSchedule("oops")).toThrow();
  });

  it("rejects a day with a malformed date", () => {
    expect(() =>
      parseImportedSchedule({ jours: [{ date: "23/11/2026", cours: [] }] }),
    ).toThrow(/Date invalide/);
  });

  it("rejects a course missing required fields", () => {
    expect(() =>
      parseImportedSchedule({
        jours: [{ date: "2026-11-23", cours: [{ debut: "09:00", matiere: "Maths" }] }],
      }),
    ).toThrow(/incomplet/);
  });

  it("rejects an unknown statut", () => {
    expect(() =>
      parseImportedSchedule({
        jours: [
          {
            date: "2026-11-23",
            cours: [{ debut: "09:00", fin: "10:00", matiere: "Maths", statut: "reporte" }],
          },
        ],
      }),
    ).toThrow(/Statut inconnu/);
  });
});
