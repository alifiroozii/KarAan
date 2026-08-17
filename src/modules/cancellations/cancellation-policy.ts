export type CancellationSide = "WORKER" | "EMPLOYER";

export type WorkerCancellationReason =
  | "SICKNESS"
  | "TRANSPORT"
  | "EMERGENCY"
  | "SCHEDULE_CONFLICT"
  | "OTHER";

export type EmployerCancellationReason =
  | "STAFFING_CHANGE"
  | "BUSINESS_CLOSED"
  | "SHIFT_CHANGED"
  | "WORKER_MISMATCH"
  | "OTHER";

export type CancellationReason =
  | WorkerCancellationReason
  | EmployerCancellationReason;

export interface CancellationPolicyTier {
  /** Inclusive upper bound. null means catch-all. */
  maxHoursBeforeStart: number | null;
  penaltyBps: number;
  workerCompensationBps: number;
  scoreImpact: number;
}

export interface CancellationPolicy {
  lateThresholdHours: number;
  tiers: CancellationPolicyTier[];
}

export interface CancellationEvaluation {
  hoursBeforeStart: number;
  minutesBeforeStart: number;
  isLate: boolean;
  penaltyRials: bigint;
  workerCompensationRials: bigint;
  scoreImpact: number;
  tier: CancellationPolicyTier;
}

export const WORKER_CANCELLATION_REASONS: WorkerCancellationReason[] = [
  "SICKNESS",
  "TRANSPORT",
  "EMERGENCY",
  "SCHEDULE_CONFLICT",
  "OTHER",
];

export const EMPLOYER_CANCELLATION_REASONS: EmployerCancellationReason[] = [
  "STAFFING_CHANGE",
  "BUSINESS_CLOSED",
  "SHIFT_CHANGED",
  "WORKER_MISMATCH",
  "OTHER",
];

/**
 * Bootstrap defaults only. They are persisted as a policy snapshot on each
 * cancellation and can be overridden through system_settings without code
 * changes. Monetary values are liabilities only; Prompt 24 never mutates a
 * wallet or ledger.
 */
export const DEFAULT_WORKER_CANCELLATION_POLICY: CancellationPolicy = {
  lateThresholdHours: 6,
  tiers: [
    { maxHoursBeforeStart: 2, penaltyBps: 2000, workerCompensationBps: 0, scoreImpact: -15 },
    { maxHoursBeforeStart: 6, penaltyBps: 1000, workerCompensationBps: 0, scoreImpact: -8 },
    { maxHoursBeforeStart: 24, penaltyBps: 500, workerCompensationBps: 0, scoreImpact: -3 },
    { maxHoursBeforeStart: null, penaltyBps: 0, workerCompensationBps: 0, scoreImpact: 0 },
  ],
};

export const DEFAULT_EMPLOYER_CANCELLATION_POLICY: CancellationPolicy = {
  lateThresholdHours: 6,
  tiers: [
    { maxHoursBeforeStart: 2, penaltyBps: 1000, workerCompensationBps: 5000, scoreImpact: -15 },
    { maxHoursBeforeStart: 6, penaltyBps: 500, workerCompensationBps: 2500, scoreImpact: -8 },
    { maxHoursBeforeStart: 24, penaltyBps: 0, workerCompensationBps: 1000, scoreImpact: -3 },
    { maxHoursBeforeStart: null, penaltyBps: 0, workerCompensationBps: 0, scoreImpact: 0 },
  ],
};

function clampBps(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(10_000, Math.max(0, Math.round(numeric)));
}

function clampScoreImpact(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(100, Math.max(-100, numeric));
}

function roundBpsAmount(amountRials: bigint, bps: number): bigint {
  if (amountRials <= 0n || bps <= 0) return 0n;
  return (amountRials * BigInt(bps) + 5_000n) / 10_000n;
}

export function normalizeCancellationPolicy(
  raw: unknown,
  fallback: CancellationPolicy
): CancellationPolicy {
  if (!raw || typeof raw !== "object") return fallback;
  const source = raw as Record<string, unknown>;
  const lateThresholdHours = Number(source.lateThresholdHours);
  const tiersRaw = Array.isArray(source.tiers) ? source.tiers : null;
  if (!tiersRaw || tiersRaw.length === 0) return fallback;

  const tiers: CancellationPolicyTier[] = [];
  for (const item of tiersRaw) {
    if (!item || typeof item !== "object") continue;
    const tier = item as Record<string, unknown>;
    const maxRaw = tier.maxHoursBeforeStart;
    const maxHoursBeforeStart =
      maxRaw === null ? null : Number.isFinite(Number(maxRaw)) ? Math.max(0, Number(maxRaw)) : null;
    tiers.push({
      maxHoursBeforeStart,
      penaltyBps: clampBps(tier.penaltyBps),
      workerCompensationBps: clampBps(tier.workerCompensationBps),
      scoreImpact: clampScoreImpact(tier.scoreImpact),
    });
  }
  if (tiers.length === 0) return fallback;
  if (!tiers.some((tier) => tier.maxHoursBeforeStart === null)) {
    tiers.push({ ...fallback.tiers[fallback.tiers.length - 1], maxHoursBeforeStart: null });
  }

  tiers.sort((a, b) => {
    if (a.maxHoursBeforeStart === null) return 1;
    if (b.maxHoursBeforeStart === null) return -1;
    return a.maxHoursBeforeStart - b.maxHoursBeforeStart;
  });

  return {
    lateThresholdHours: Number.isFinite(lateThresholdHours)
      ? Math.max(0, lateThresholdHours)
      : fallback.lateThresholdHours,
    tiers,
  };
}

export function assertCancellationReason(
  side: CancellationSide,
  reason: string,
  description?: string
): asserts reason is CancellationReason {
  const allowed =
    side === "WORKER" ? WORKER_CANCELLATION_REASONS : EMPLOYER_CANCELLATION_REASONS;
  if (!allowed.includes(reason as never)) {
    throw new Error("INVALID_CANCELLATION_REASON");
  }
  if (reason === "OTHER" && (description?.trim().length ?? 0) < 10) {
    throw new Error("CANCELLATION_DESCRIPTION_REQUIRED");
  }
}

export function calculateScheduledPayRials(input: {
  startAt: Date;
  endAt: Date;
  hourlyPayRials: bigint;
}): bigint {
  const minutes = Math.max(
    0,
    Math.floor((input.endAt.getTime() - input.startAt.getTime()) / 60_000)
  );
  if (minutes <= 0 || input.hourlyPayRials <= 0n) return 0n;
  return (input.hourlyPayRials * BigInt(minutes) + 30n) / 60n;
}

export function evaluateCancellationPolicy(input: {
  now: Date;
  shiftStartAt: Date;
  scheduledPayRials: bigint;
  policy: CancellationPolicy;
}): CancellationEvaluation {
  const rawMinutesBeforeStart = Math.floor(
    (input.shiftStartAt.getTime() - input.now.getTime()) / 60_000
  );
  const hoursBeforeStart = rawMinutesBeforeStart / 60;
  const policyHours = Math.max(0, hoursBeforeStart);
  const tier =
    input.policy.tiers.find(
      (item) => item.maxHoursBeforeStart === null || policyHours <= item.maxHoursBeforeStart
    ) ?? input.policy.tiers[input.policy.tiers.length - 1];

  return {
    hoursBeforeStart,
    minutesBeforeStart: rawMinutesBeforeStart,
    isLate: hoursBeforeStart < input.policy.lateThresholdHours,
    penaltyRials: roundBpsAmount(input.scheduledPayRials, tier.penaltyBps),
    workerCompensationRials: roundBpsAmount(
      input.scheduledPayRials,
      tier.workerCompensationBps
    ),
    scoreImpact: tier.scoreImpact,
    tier,
  };
}
