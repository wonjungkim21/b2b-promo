import { describe, expect, it } from 'vitest';
import { getMaxApplyCount, getPlannedPoints, getRemainingPoints } from './pointCalc';

describe('getMaxApplyCount', () => {
  it.each([
    [0, 0],
    [999, 0],
    [1000, 1],
    [5500, 5],
  ])('pointBalance=%d -> %d', (pointBalance, expected) => {
    expect(getMaxApplyCount(pointBalance)).toBe(expected);
  });
});

describe('getPlannedPoints', () => {
  it('count=2 -> 2000', () => {
    expect(getPlannedPoints(2)).toBe(2000);
  });
});

describe('getRemainingPoints', () => {
  it('pointBalance=5000, count=2 -> 3000', () => {
    expect(getRemainingPoints(5000, 2)).toBe(3000);
  });
});
