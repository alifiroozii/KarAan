import { describe, it, expect } from "vitest";
import { MatchingScoringService, WorkerScoringInput } from "@/modules/matching/scoring.service";

describe("Matching Engine v1 Rule-Based Scoring Unit Tests", () => {
  const scoringService = new MatchingScoringService();

  it("should calculate near 100% score for a top-tier candidate", () => {
    const candidate: WorkerScoringInput = {
      workerId: "w_top",
      distanceKm: 2.0,
      requiredSkills: ["انبارداری"],
      workerSkills: ["انبارداری", "بسته‌بندی"],
      reliabilityScore: 98,
      rating: 5.0,
      completedShiftsCount: 60,
      workedForEmployerBefore: true,
      cancellationRate: 0.0,
      noShowCount: 0,
    };

    const explanation = scoringService.calculateScore(candidate);

    expect(explanation.distanceScore).toBe(100);
    expect(explanation.skillScore).toBe(100);
    expect(explanation.reliabilityScore).toBe(98);
    expect(explanation.ratingScore).toBe(100);
    expect(explanation.previousEmployerBonus).toBe(100);
    expect(explanation.cancellationPenalty).toBe(0);
    expect(explanation.noShowPenalty).toBe(0);
    expect(explanation.finalMatchScore).toBeGreaterThanOrEqual(98);
  });

  it("should apply severe penalties for No-Show history", () => {
    const candidateWithNoShow: WorkerScoringInput = {
      workerId: "w_noshow",
      distanceKm: 2.0,
      requiredSkills: ["انبارداری"],
      workerSkills: ["انبارداری"],
      reliabilityScore: 70,
      rating: 4.0,
      completedShiftsCount: 10,
      workedForEmployerBefore: false,
      cancellationRate: 0.1,
      noShowCount: 2, // 2 No-Shows -> 50 pts penalty
    };

    const explanation = scoringService.calculateScore(candidateWithNoShow);

    expect(explanation.noShowPenalty).toBe(50);
    expect(explanation.finalMatchScore).toBeLessThan(50);
  });

  it("should rank top candidates higher than lower candidates", () => {
    const workerA: WorkerScoringInput = {
      workerId: "w_A",
      distanceKm: 3.0,
      requiredSkills: ["انبارداری"],
      workerSkills: ["انبارداری"],
      reliabilityScore: 95,
      rating: 4.8,
      completedShiftsCount: 30,
      workedForEmployerBefore: false,
      cancellationRate: 0,
      noShowCount: 0,
    };

    const workerB: WorkerScoringInput = {
      workerId: "w_B",
      distanceKm: 20.0,
      requiredSkills: ["انبارداری"],
      workerSkills: [],
      reliabilityScore: 60,
      rating: 3.5,
      completedShiftsCount: 2,
      workedForEmployerBefore: false,
      cancellationRate: 0.2,
      noShowCount: 1,
    };

    const scoreA = scoringService.calculateScore(workerA).finalMatchScore;
    const scoreB = scoringService.calculateScore(workerB).finalMatchScore;

    expect(scoreA).toBeGreaterThan(scoreB);
  });
});
