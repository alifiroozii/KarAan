export interface ReliabilityPolicy {
  version: string;
  minScore: number;
  maxScore: number;
  shiftCompletedDelta: number;
  punctualBonusDelta: number;
  noShowFallbackDelta: number;
  lateCancellationFallbackDelta: number;
  strikeDurationDays: number;
  automaticSuspensionAtStrikeWeight: number;
  automaticSuspensionDays: number;
  permanentBanAtStrikeWeight: number | null;
}

export const DEFAULT_RELIABILITY_POLICY: ReliabilityPolicy = {
  version: "v1",
  minScore: 0,
  maxScore: 100,
  shiftCompletedDelta: 0.5,
  punctualBonusDelta: 0.5,
  noShowFallbackDelta: -25,
  lateCancellationFallbackDelta: -10,
  strikeDurationDays: 90,
  automaticSuspensionAtStrikeWeight: 3,
  automaticSuspensionDays: 3,
  permanentBanAtStrikeWeight: null,
};

function finite(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function normalizeReliabilityPolicy(value: unknown): ReliabilityPolicy {
  if (!value || typeof value !== "object") return DEFAULT_RELIABILITY_POLICY;
  const raw = value as Record<string, unknown>;
  const minScore = Math.max(0, Math.min(100, finite(raw.minScore) ?? 0));
  const maxScore = Math.max(minScore, Math.min(100, finite(raw.maxScore) ?? 100));
  const suspensionWeight = Math.max(
    1,
    Math.min(20, Math.floor(finite(raw.automaticSuspensionAtStrikeWeight) ?? 3))
  );
  const banRaw = finite(raw.permanentBanAtStrikeWeight);

  return {
    version:
      typeof raw.version === "string" && raw.version.trim().length > 0
        ? raw.version.trim().slice(0, 50)
        : DEFAULT_RELIABILITY_POLICY.version,
    minScore,
    maxScore,
    shiftCompletedDelta: Math.max(-20, Math.min(20, finite(raw.shiftCompletedDelta) ?? 0.5)),
    punctualBonusDelta: Math.max(-20, Math.min(20, finite(raw.punctualBonusDelta) ?? 0.5)),
    noShowFallbackDelta: Math.max(-100, Math.min(0, finite(raw.noShowFallbackDelta) ?? -25)),
    lateCancellationFallbackDelta: Math.max(
      -100,
      Math.min(0, finite(raw.lateCancellationFallbackDelta) ?? -10)
    ),
    strikeDurationDays: Math.max(
      1,
      Math.min(3650, Math.floor(finite(raw.strikeDurationDays) ?? 90))
    ),
    automaticSuspensionAtStrikeWeight: suspensionWeight,
    automaticSuspensionDays: Math.max(
      1,
      Math.min(365, Math.floor(finite(raw.automaticSuspensionDays) ?? 3))
    ),
    permanentBanAtStrikeWeight:
      banRaw == null || banRaw <= 0
        ? null
        : Math.max(suspensionWeight, Math.min(100, Math.floor(banRaw))),
  };
}

export function clampReliabilityScore(score: number, policy: ReliabilityPolicy): number {
  return Math.round(Math.min(policy.maxScore, Math.max(policy.minScore, score)) * 100) / 100;
}
