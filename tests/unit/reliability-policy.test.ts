import { describe, expect, it } from "vitest";
import {
  clampReliabilityScore,
  DEFAULT_RELIABILITY_POLICY,
  normalizeReliabilityPolicy,
} from "@/modules/reliability/reliability-policy";

describe("reliability policy", () => {
  it("uses safe defaults", () => {
    expect(normalizeReliabilityPolicy(undefined)).toEqual(DEFAULT_RELIABILITY_POLICY);
  });

  it("clamps score within policy bounds", () => {
    expect(clampReliabilityScore(120, DEFAULT_RELIABILITY_POLICY)).toBe(100);
    expect(clampReliabilityScore(-10, DEFAULT_RELIABILITY_POLICY)).toBe(0);
    expect(clampReliabilityScore(93.456, DEFAULT_RELIABILITY_POLICY)).toBe(93.46);
  });

  it("normalizes thresholds and negative penalties", () => {
    const policy = normalizeReliabilityPolicy({
      version: "v2-test",
      minScore: -50,
      maxScore: 140,
      noShowFallbackDelta: 10,
      lateCancellationFallbackDelta: -250,
      automaticSuspensionAtStrikeWeight: 4,
      automaticSuspensionDays: 7,
      permanentBanAtStrikeWeight: 2,
    });

    expect(policy.version).toBe("v2-test");
    expect(policy.minScore).toBe(0);
    expect(policy.maxScore).toBe(100);
    expect(policy.noShowFallbackDelta).toBe(0);
    expect(policy.lateCancellationFallbackDelta).toBe(-100);
    expect(policy.automaticSuspensionAtStrikeWeight).toBe(4);
    expect(policy.automaticSuspensionDays).toBe(7);
    expect(policy.permanentBanAtStrikeWeight).toBe(4);
  });

  it("keeps permanent ban disabled when threshold is absent", () => {
    expect(normalizeReliabilityPolicy({}).permanentBanAtStrikeWeight).toBeNull();
  });
});
