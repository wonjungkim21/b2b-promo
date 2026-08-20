export const POINTS_PER_APPLY = 1000;

export function getMaxApplyCount(pointBalance: number): number {
  return Math.floor(pointBalance / POINTS_PER_APPLY);
}

export function getPlannedPoints(count: number): number {
  return count * POINTS_PER_APPLY;
}

export function getRemainingPoints(pointBalance: number, count: number): number {
  return pointBalance - getPlannedPoints(count);
}
