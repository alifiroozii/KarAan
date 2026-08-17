export interface BackfillPolicy {
  maxCandidates: number;
  maxDistanceKm: number;
  offerTtlSeconds: number;
  maxDispatchAttempts: number;
  retryDelaySeconds: number;
  urgentBonusRials: bigint;
}

export const DEFAULT_BACKFILL_POLICY: BackfillPolicy = {
  maxCandidates: 8,
  maxDistanceKm: 35,
  offerTtlSeconds: 300,
  maxDispatchAttempts: 3,
  retryDelaySeconds: 90,
  urgentBonusRials: 0n,
};

function finiteNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseNonNegativeBigInt(value: unknown, fallback: bigint): bigint {
  try {
    const parsed = BigInt(typeof value === "string" || typeof value === "number" ? value : fallback);
    return parsed >= 0n ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function normalizeBackfillPolicy(value: unknown): BackfillPolicy {
  if (!value || typeof value !== "object") return DEFAULT_BACKFILL_POLICY;
  const raw = value as Record<string, unknown>;

  return {
    maxCandidates: Math.max(
      1,
      Math.min(50, Math.floor(finiteNumber(raw.maxCandidates) ?? DEFAULT_BACKFILL_POLICY.maxCandidates))
    ),
    maxDistanceKm: Math.max(
      1,
      Math.min(100, finiteNumber(raw.maxDistanceKm) ?? DEFAULT_BACKFILL_POLICY.maxDistanceKm)
    ),
    offerTtlSeconds: Math.max(
      60,
      Math.min(3600, Math.floor(finiteNumber(raw.offerTtlSeconds) ?? DEFAULT_BACKFILL_POLICY.offerTtlSeconds))
    ),
    maxDispatchAttempts: Math.max(
      1,
      Math.min(10, Math.floor(finiteNumber(raw.maxDispatchAttempts) ?? DEFAULT_BACKFILL_POLICY.maxDispatchAttempts))
    ),
    retryDelaySeconds: Math.max(
      30,
      Math.min(3600, Math.floor(finiteNumber(raw.retryDelaySeconds) ?? DEFAULT_BACKFILL_POLICY.retryDelaySeconds))
    ),
    urgentBonusRials: parseNonNegativeBigInt(raw.urgentBonusRials, DEFAULT_BACKFILL_POLICY.urgentBonusRials),
  };
}
