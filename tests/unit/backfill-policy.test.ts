import { describe, expect, it } from "vitest";
import {
  DEFAULT_BACKFILL_POLICY,
  normalizeBackfillPolicy,
} from "@/modules/backfill/backfill-policy";

describe("backfill policy", () => {
  it("uses safe defaults", () => {
    expect(normalizeBackfillPolicy(undefined)).toEqual(DEFAULT_BACKFILL_POLICY);
  });

  it("normalizes operational limits and urgent bonus", () => {
    expect(
      normalizeBackfillPolicy({
        maxCandidates: 12,
        maxDistanceKm: 45,
        offerTtlSeconds: 180,
        maxDispatchAttempts: 4,
        retryDelaySeconds: 60,
        urgentBonusRials: "750000",
      })
    ).toEqual({
      maxCandidates: 12,
      maxDistanceKm: 45,
      offerTtlSeconds: 180,
      maxDispatchAttempts: 4,
      retryDelaySeconds: 60,
      urgentBonusRials: 750000n,
    });
  });

  it("clamps unsafe values", () => {
    expect(
      normalizeBackfillPolicy({
        maxCandidates: 999,
        maxDistanceKm: 0,
        offerTtlSeconds: 5,
        maxDispatchAttempts: 0,
        retryDelaySeconds: 2,
        urgentBonusRials: "-10",
      })
    ).toEqual({
      maxCandidates: 50,
      maxDistanceKm: 1,
      offerTtlSeconds: 60,
      maxDispatchAttempts: 1,
      retryDelaySeconds: 30,
      urgentBonusRials: 0n,
    });
  });

  it("falls back when urgent bonus is invalid", () => {
    expect(normalizeBackfillPolicy({ urgentBonusRials: "not-money" }).urgentBonusRials).toBe(0n);
  });
});
