export type ArrivalRejectionReason = "LOW_LOCATION_ACCURACY" | "OUTSIDE_GEOFENCE";

export interface ArrivalEvidenceEvaluation {
  accepted: boolean;
  reason?: ArrivalRejectionReason;
}

export function evaluateArrivalEvidence(input: {
  accuracyMeters: number;
  maxAccuracyMeters: number;
  distanceMeters: number;
  geofenceRadiusMeters: number;
}): ArrivalEvidenceEvaluation {
  if (input.accuracyMeters > input.maxAccuracyMeters) {
    return { accepted: false, reason: "LOW_LOCATION_ACCURACY" };
  }

  if (input.distanceMeters > input.geofenceRadiusMeters) {
    return { accepted: false, reason: "OUTSIDE_GEOFENCE" };
  }

  return { accepted: true };
}
