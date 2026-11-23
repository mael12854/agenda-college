// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "./ics-proxy";

afterEach(() => {
  vi.unstubAllGlobals();
});

function req(url: string, method = "GET"): Request {
  return new Request(url, { method });
}

describe("ics-proxy handler", () => {
  it("rejects a non-GET request", async () => {
    const res = await handler(req("https://app.example/api/ics-proxy?url=https://ecoledirecte.com/x.ics", "POST"));
    expect(res.status).toBe(405);
  });

  it("rejects a missing url param", async () => {
    const res = await handler(req("https://app.example/api/ics-proxy"));
    expect(res.status).toBe(400);
  });

  it("rejects a non-ecoledirecte target before ever calling fetch", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const res = await handler(req("https://app.example/api/ics-proxy?url=https://evil.example/x.ics"));
    expect(res.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("forwards the upstream calendar text with the right content-type and CORS header on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n", { status: 200 })),
    );
    const res = await handler(
      req("https://app.example/api/ics-proxy?url=https://ecoledirecte.com/agenda.ics"),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/calendar/);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(await res.text()).toContain("BEGIN:VCALENDAR");
  });

  it("returns a 502 when the upstream request fails outright", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    const res = await handler(
      req("https://app.example/api/ics-proxy?url=https://ecoledirecte.com/agenda.ics"),
    );
    expect(res.status).toBe(502);
  });

  it("returns a 502 when the upstream responds with an error status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 403 })),
    );
    const res = await handler(
      req("https://app.example/api/ics-proxy?url=https://ecoledirecte.com/agenda.ics"),
    );
    expect(res.status).toBe(502);
  });
});
