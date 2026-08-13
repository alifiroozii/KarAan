import { describe, it, expect } from "vitest";
import { RadarWorkerCandidate } from "@/app/employer/live/page";

describe("Employer Live Map Unit Tests", () => {
  const mockCandidates: RadarWorkerCandidate[] = [
    {
      id: "w1",
      maskedName: "کارجو کد #101",
      approxDistanceKm: 3.5,
      rating: 4.8,
      reliabilityScore: 98,
      completedShifts: 40,
      primarySkill: "انبارداری",
      status: "AVAILABLE",
      approxLat: 35.7,
      approxLng: 51.35,
    },
    {
      id: "w2",
      maskedName: "کارجو کد #102",
      approxDistanceKm: 12.0,
      rating: 4.2,
      reliabilityScore: 88,
      completedShifts: 10,
      primarySkill: "فروشندگی",
      status: "AVAILABLE",
      approxLat: 35.75,
      approxLng: 51.4,
    },
  ];

  it("should mask exact worker identity before match", () => {
    expect(mockCandidates[0].maskedName).toMatch(/کارجو کد #/);
    expect(mockCandidates[0].maskedName).not.toContain("علی");
  });

  it("should filter candidates by max distance", () => {
    const maxDist = 5.0;
    const filtered = mockCandidates.filter((w) => w.approxDistanceKm <= maxDist);
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe("w1");
  });

  it("should filter candidates by minimum rating", () => {
    const minRating = 4.5;
    const filtered = mockCandidates.filter((w) => w.rating >= minRating);
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe("w1");
  });
});
