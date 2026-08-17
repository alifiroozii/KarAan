import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { assertSafeMutationOrigin } from "./request-security";

function request(method: string, headers: Record<string, string> = {}, url = "https://karaan.example/api/test") {
  return new NextRequest(url, { method, headers });
}

describe("authenticated mutation origin security", () => {
  it("allows safe methods without an origin", () => {
    expect(() => assertSafeMutationOrigin(request("GET", { cookie: "karaan_session=test" }))).not.toThrow();
  });

  it("allows exact-origin cookie mutations", () => {
    expect(() =>
      assertSafeMutationOrigin(
        request("POST", {
          cookie: "karaan_session=test",
          origin: "https://karaan.example",
          "sec-fetch-site": "same-origin",
        })
      )
    ).not.toThrow();
  });

  it("rejects a different origin", () => {
    expect(() =>
      assertSafeMutationOrigin(
        request("PATCH", { cookie: "karaan_session=test", origin: "https://evil.example" })
      )
    ).toThrow(/Origin/);
  });

  it("rejects browser cross-site mutations", () => {
    expect(() =>
      assertSafeMutationOrigin(
        request("DELETE", {
          cookie: "karaan_session=test",
          origin: "https://karaan.example",
          "sec-fetch-site": "cross-site",
        })
      )
    ).toThrow(/cross-site/);
  });

  it("requires origin or same-origin referer for cookie mutations", () => {
    expect(() => assertSafeMutationOrigin(request("POST", { cookie: "karaan_session=test" }))).toThrow(/Origin یا Referer/);
    expect(() =>
      assertSafeMutationOrigin(
        request("POST", { cookie: "karaan_session=test", referer: "https://karaan.example/worker" })
      )
    ).not.toThrow();
  });

  it("keeps bearer-token native/server clients available", () => {
    expect(() =>
      assertSafeMutationOrigin(request("POST", { authorization: "Bearer native-token" }))
    ).not.toThrow();
  });
});
