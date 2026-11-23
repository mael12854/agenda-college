import { describe, expect, it } from "vitest";
import { parseIcalSchedule } from "./importIcal";

function ics(events: string): string {
  return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Test//FR\r\n${events}END:VCALENDAR\r\n`;
}

describe("parseIcalSchedule", () => {
  it("maps a floating-local-time VEVENT into a once course", () => {
    const { courses, dates } = parseIcalSchedule(
      ics(
        "BEGIN:VEVENT\r\n" +
          "UID:1@ecoledirecte.com\r\n" +
          "DTSTART;TZID=Europe/Paris:20261123T090000\r\n" +
          "DTEND;TZID=Europe/Paris:20261123T100000\r\n" +
          "SUMMARY:Mathématiques\r\n" +
          "LOCATION:Salle 214\r\n" +
          "DESCRIPTION:Mme Planchet\r\n" +
          "END:VEVENT\r\n",
      ),
    );

    expect(dates).toEqual(["2026-11-23"]);
    expect(courses).toHaveLength(1);
    expect(courses[0]).toMatchObject({
      subject: "Mathématiques",
      room: "Salle 214",
      note: "Mme Planchet",
      startTime: "09:00",
      endTime: "10:00",
      status: "normal",
      recurrence: { type: "once", date: "2026-11-23" },
    });
  });

  it("converts a UTC (Z) DTSTART to Europe/Paris wall-clock time", () => {
    // 2026-11-23 is CET (UTC+1) — 08:00Z is 09:00 local.
    const { courses } = parseIcalSchedule(
      ics(
        "BEGIN:VEVENT\r\n" +
          "DTSTART:20261123T080000Z\r\n" +
          "DTEND:20261123T090000Z\r\n" +
          "SUMMARY:Anglais\r\n" +
          "END:VEVENT\r\n",
      ),
    );
    expect(courses[0].startTime).toBe("09:00");
    expect(courses[0].endTime).toBe("10:00");
  });

  it("maps STATUS:CANCELLED to the annule status", () => {
    const { courses } = parseIcalSchedule(
      ics(
        "BEGIN:VEVENT\r\n" +
          "DTSTART;TZID=Europe/Paris:20261126T090000\r\n" +
          "DTEND;TZID=Europe/Paris:20261126T100000\r\n" +
          "SUMMARY:Anglais\r\n" +
          "STATUS:CANCELLED\r\n" +
          "END:VEVENT\r\n",
      ),
    );
    expect(courses[0].status).toBe("annule");
  });

  it("unfolds a continuation line and unescapes commas/semicolons/newlines", () => {
    const { courses } = parseIcalSchedule(
      ics(
        "BEGIN:VEVENT\r\n" +
          "DTSTART;TZID=Europe/Paris:20261123T140000\r\n" +
          "DTEND;TZID=Europe/Paris:20261123T150000\r\n" +
          "SUMMARY:Français\r\n" +
          "DESCRIPTION:Chapitre 3\\, 4\\; devoir\\nà rendre jeudi\r\n" +
          " (suite de la ligne)\r\n" +
          "END:VEVENT\r\n",
      ),
    );
    // Unfolding eats exactly one leading whitespace char from the continuation
    // line — that's the RFC 5545 fold marker, not real content.
    expect(courses[0].note).toBe("Chapitre 3, 4; devoir\nà rendre jeudi(suite de la ligne)");
  });

  it("skips an all-day VALUE=DATE event (not a timetable slot)", () => {
    const { courses, dates } = parseIcalSchedule(
      ics("BEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20261101\r\nSUMMARY:Toussaint\r\nEND:VEVENT\r\n"),
    );
    expect(courses).toEqual([]);
    expect(dates).toEqual([]);
  });

  it("collects multiple events across different days", () => {
    const { dates, courses } = parseIcalSchedule(
      ics(
        "BEGIN:VEVENT\r\nDTSTART;TZID=Europe/Paris:20261123T090000\r\nDTEND;TZID=Europe/Paris:20261123T100000\r\nSUMMARY:Maths\r\nEND:VEVENT\r\n" +
          "BEGIN:VEVENT\r\nDTSTART;TZID=Europe/Paris:20261124T090000\r\nDTEND;TZID=Europe/Paris:20261124T100000\r\nSUMMARY:Sciences\r\nEND:VEVENT\r\n",
      ),
    );
    expect(dates).toEqual(["2026-11-23", "2026-11-24"]);
    expect(courses).toHaveLength(2);
  });

  it("rejects text that isn't an iCal calendar", () => {
    expect(() => parseIcalSchedule("not a calendar")).toThrow(/iCal/);
  });

  it("rejects a calendar with no usable events", () => {
    expect(() => parseIcalSchedule(ics(""))).toThrow(/Aucun événement/);
  });
});
