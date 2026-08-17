export type MatchRelationshipType = "PREFERRED" | "FAVORITE" | "BLOCKED" | null;

export function relationshipPriority(type: MatchRelationshipType): number {
  if (type === "PREFERRED") return 2;
  if (type === "FAVORITE") return 1;
  return 0;
}

export function relationshipIsHardBlocked(input: {
  rosterType: MatchRelationshipType;
  blockedByEmployer: boolean;
  blockedByWorker: boolean;
}): boolean {
  return (
    input.rosterType === "BLOCKED" ||
    input.blockedByEmployer ||
    input.blockedByWorker
  );
}
