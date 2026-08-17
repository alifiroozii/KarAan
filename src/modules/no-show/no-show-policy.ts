export interface NoShowPolicy {
  gracePeriodMinutes: number;
  finalThresholdMinutes: number;
  reliabilityPenalty: number;
  strikeRecommended: boolean;
}

export const DEFAULT_NO_SHOW_POLICY: NoShowPolicy = {
  gracePeriodMinutes: 10,
  finalThresholdMinutes: 20,
  reliabilityPenalty: 25,
  strikeRecommended: true,
};

export type NoShowDecision = "NOT_DUE" | "POTENTIAL" | "FINAL";

function finiteNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function normalizeNoShowPolicy(value: unknown): NoShowPolicy {
  if (!value || typeof value !== "object") return DEFAULT_NO_SHOW_POLICY;
  const raw = value as Record<string, unknown>;
  const grace = Math.max(
    0,
    Math.floor(finiteNumber(raw.gracePeriodMinutes) ?? DEFAULT_NO_SHOW_POLICY.gracePeriodMinutes)
  );
  const finalThreshold = Math.max(
    grace + 1,
    Math.floor(
      finiteNumber(raw.finalThresholdMinutes) ?? DEFAULT_NO_SHOW_POLICY.finalThresholdMinutes
    )
  );
  const penalty = Math.max(
    0,
    Math.min(100, finiteNumber(raw.reliabilityPenalty) ?? DEFAULT_NO_SHOW_POLICY.reliabilityPenalty)
  );

  return {
    gracePeriodMinutes: grace,
    finalThresholdMinutes: finalThreshold,
    reliabilityPenalty: penalty,
    strikeRecommended:
      typeof raw.strikeRecommended === "boolean"
        ? raw.strikeRecommended
        : DEFAULT_NO_SHOW_POLICY.strikeRecommended,
  };
}

export function evaluateNoShowAt(input: {
  shiftStartAt: Date;
  now: Date;
  policy: NoShowPolicy;
}): { decision: NoShowDecision; minutesAfterStart: number } {
  const minutesAfterStart = Math.floor(
    (input.now.getTime() - input.shiftStartAt.getTime()) / 60_000
  );

  if (minutesAfterStart < input.policy.gracePeriodMinutes) {
    return { decision: "NOT_DUE", minutesAfterStart };
  }
  if (minutesAfterStart < input.policy.finalThresholdMinutes) {
    return { decision: "POTENTIAL", minutesAfterStart };
  }
  return { decision: "FINAL", minutesAfterStart };
}

export const NO_SHOW_ELIGIBLE_ASSIGNMENT_STATES = [
  "RECONFIRM_PENDING",
  "CONFIRMED",
  "EN_ROUTE",
  "ARRIVED",
] as const;

export type NoShowEligibleAssignmentState =
  (typeof NO_SHOW_ELIGIBLE_ASSIGNMENT_STATES)[number];

export function isNoShowEligibleState(state: string): state is NoShowEligibleAssignmentState {
  return (NO_SHOW_ELIGIBLE_ASSIGNMENT_STATES as readonly string[]).includes(state);
}
