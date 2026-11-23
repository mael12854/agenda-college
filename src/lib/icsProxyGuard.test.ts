import { describe, expect, it } from "vitest";
import { checkIcsUrl } from "./icsProxyGuard";

describe("checkIcsUrl", () => {
  it("allows the bare domain and real subdomains, over https", () => {
    expect(checkIcsUrl("https://ecoledirecte.com/agenda.ics").ok).toBe(true);
    expect(checkIcsUrl("https://api.ecoledirecte.com/agenda.ics").ok).toBe(true);
    expect(checkIcsUrl("https://a.b.ecoledirecte.com/x.ics").ok).toBe(true);
  });

  it("rejects http (not https)", () => {
    const result = checkIcsUrl("http://ecoledirecte.com/agenda.ics");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/https/);
  });

  it("rejects a look-alike domain that merely ends with the right string", () => {
    expect(checkIcsUrl("https://notecoledirecte.com/agenda.ics").ok).toBe(false);
    expect(checkIcsUrl("https://evilecoledirecte.com/agenda.ics").ok).toBe(false);
  });

  it("rejects a domain that merely starts with the right string (suffix attack)", () => {
    expect(checkIcsUrl("https://ecoledirecte.com.evil.example/agenda.ics").ok).toBe(false);
  });

  it("rejects an unrelated host entirely", () => {
    expect(checkIcsUrl("https://example.com/agenda.ics").ok).toBe(false);
  });

  it("rejects malformed input", () => {
    expect(checkIcsUrl(null).ok).toBe(false);
    expect(checkIcsUrl("").ok).toBe(false);
    expect(checkIcsUrl("not a url").ok).toBe(false);
  });
});
