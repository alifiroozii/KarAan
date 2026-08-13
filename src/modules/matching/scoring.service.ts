export interface MatchingWeights {
  distance: number;
  skill: number;
  reliability: number;
  rating: number;
  experience: number;
  previousEmployer: number;
}

export const DEFAULT_MATCHING_WEIGHTS: MatchingWeights = {
  distance: 0.25,
  skill: 0.25,
  reliability: 0.20,
  rating: 0.15,
  experience: 0.10,
  previousEmployer: 0.05,
};

export interface WorkerScoringInput {
  workerId: string;
  distanceKm: number;
  requiredSkills: string[];
  workerSkills: string[];
  reliabilityScore: number; // 0-100
  rating: number; // 0-5.0
  completedShiftsCount: number;
  workedForEmployerBefore: boolean;
  cancellationRate: number; // 0-1 (e.g. 0.05 = 5%)
  noShowCount: number;
}

export interface ScoreExplanation {
  distanceScore: number;
  skillScore: number;
  reliabilityScore: number;
  ratingScore: number;
  experienceScore: number;
  previousEmployerBonus: number;
  cancellationPenalty: number;
  noShowPenalty: number;
  finalMatchScore: number;
}

export class MatchingScoringService {
  private weights: MatchingWeights;

  constructor(customWeights: Partial<MatchingWeights> = {}) {
    this.weights = { ...DEFAULT_MATCHING_WEIGHTS, ...customWeights };
  }

  /**
   * Calculate Rule-Based Match Score (0-100) with detailed explanation breakdown
   */
  calculateScore(input: WorkerScoringInput): ScoreExplanation {
    // 1. Distance Sub-Score (0-100)
    let distanceScore = 100;
    if (input.distanceKm <= 5) distanceScore = 100;
    else if (input.distanceKm <= 15) distanceScore = 80;
    else if (input.distanceKm <= 25) distanceScore = 50;
    else distanceScore = Math.max(0, 100 - (input.distanceKm - 25) * 5);

    // 2. Skill Match Sub-Score (0-100)
    let skillScore = 100;
    if (input.requiredSkills.length > 0) {
      const matched = input.requiredSkills.filter((s) => input.workerSkills.includes(s));
      skillScore = Math.round((matched.length / input.requiredSkills.length) * 100);
    }

    // 3. Reliability Sub-Score (0-100)
    const reliabilityScore = Math.min(100, Math.max(0, input.reliabilityScore));

    // 4. Rating Sub-Score (0-100)
    const ratingScore = Math.min(100, Math.round((input.rating / 5.0) * 100));

    // 5. Experience / Completed Shifts Sub-Score (0-100)
    let experienceScore = 50;
    if (input.completedShiftsCount >= 50) experienceScore = 100;
    else if (input.completedShiftsCount >= 20) experienceScore = 85;
    else if (input.completedShiftsCount >= 5) experienceScore = 70;

    // 6. Previous Employer Bonus (0 or 100)
    const previousEmployerBonus = input.workedForEmployerBefore ? 100 : 0;

    // 7. Penalties (Cancellation & No-Show)
    const cancellationPenalty = Math.round(input.cancellationRate * 30); // max 30 pts penalty
    const noShowPenalty = Math.min(50, input.noShowCount * 25); // 25 pts per no-show

    // Weighted Composite Score Calculation
    const weightedBase =
      distanceScore * this.weights.distance +
      skillScore * this.weights.skill +
      reliabilityScore * this.weights.reliability +
      ratingScore * this.weights.rating +
      experienceScore * this.weights.experience +
      previousEmployerBonus * this.weights.previousEmployer;

    const finalMatchScore = Math.max(
      0,
      Math.min(100, Math.round(weightedBase - cancellationPenalty - noShowPenalty))
    );

    return {
      distanceScore,
      skillScore,
      reliabilityScore,
      ratingScore,
      experienceScore,
      previousEmployerBonus,
      cancellationPenalty,
      noShowPenalty,
      finalMatchScore,
    };
  }
}
