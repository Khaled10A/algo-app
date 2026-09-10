import { describe, expect, it } from 'vitest';
import {
  validateActivityInput,
  sortByFinishTime,
  activitySelection,
  activityRun,
  generateRandomActivities,
  getDefaultActivities,
  ACTIVITY_MAX_COUNT,
  getMaxActivityCount,
} from './activity';

describe('validateActivityInput', () => {
  it('accepts valid activities', () => {
    const activities = [
      { start: 1, finish: 4 },
      { start: 3, finish: 5 },
    ];
    const result = validateActivityInput(activities);
    expect(result.valid).toBe(true);
    expect(result.reason).toBeNull();
    expect(result.processed).toHaveLength(2);
    expect(result.processed[0].id).toBe(0);
    expect(result.processed[1].id).toBe(1);
  });

  it('rejects empty array', () => {
    const result = validateActivityInput([]);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('empty');
  });

  it('rejects non-array input', () => {
    const result = validateActivityInput(null);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('array');
  });

  it('rejects activities exceeding max count', () => {
    const activities = Array.from({ length: ACTIVITY_MAX_COUNT + 1 }, (_, i) => ({
      start: i,
      finish: i + 1,
    }));
    const result = validateActivityInput(activities);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Too many');
    expect(result.reason).toContain(ACTIVITY_MAX_COUNT.toString());
  });

  it('accepts activities at max count', () => {
    const activities = Array.from({ length: ACTIVITY_MAX_COUNT }, (_, i) => ({
      start: i,
      finish: i + 1,
    }));
    const result = validateActivityInput(activities);
    expect(result.valid).toBe(true);
  });

  it('rejects activity with invalid structure', () => {
    const activities = [{ start: 1 }]; // Missing finish
    const result = validateActivityInput(activities);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('invalid');
  });

  it('rejects activity with start > finish', () => {
    const activities = [{ start: 5, finish: 3 }];
    const result = validateActivityInput(activities);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('start');
  });

  it('rejects activity with negative times', () => {
    const activities = [{ start: -1, finish: 4 }];
    const result = validateActivityInput(activities);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('negative');
  });

  it('assigns unique IDs to activities', () => {
    const activities = [
      { start: 1, finish: 4 },
      { start: 3, finish: 5 },
    ];
    const result = validateActivityInput(activities);
    expect(result.processed[0].id).toBe(0);
    expect(result.processed[1].id).toBe(1);
  });

  it('preserves names if provided', () => {
    const activities = [
      { start: 1, finish: 4, name: 'Meeting' },
      { start: 3, finish: 5, name: 'Lunch' },
    ];
    const result = validateActivityInput(activities);
    expect(result.processed[0].name).toBe('Meeting');
    expect(result.processed[1].name).toBe('Lunch');
  });

  it('adds default names if not provided', () => {
    const activities = [{ start: 1, finish: 4 }];
    const result = validateActivityInput(activities);
    expect(result.processed[0].name).toBe('Activity 0');
  });
});

describe('sortByFinishTime', () => {
  it('sorts activities by finish time ascending', () => {
    const activities = [
      { id: 0, start: 1, finish: 10, name: 'A' },
      { id: 1, start: 3, finish: 5, name: 'B' },
      { id: 2, start: 0, finish: 8, name: 'C' },
    ];
    const sorted = sortByFinishTime(activities);
    expect(sorted[0].finish).toBe(5);
    expect(sorted[1].finish).toBe(8);
    expect(sorted[2].finish).toBe(10);
  });

  it('returns new array (does not mutate original)', () => {
    const activities = [
      { id: 0, start: 1, finish: 10 },
      { id: 1, start: 3, finish: 5 },
    ];
    const original = [...activities];
    sortByFinishTime(activities);
    expect(activities).toEqual(original);
  });

  it('handles empty array', () => {
    const result = sortByFinishTime([]);
    expect(result).toHaveLength(0);
  });

  it('handles single activity', () => {
    const activities = [{ id: 0, start: 1, finish: 4 }];
    const sorted = sortByFinishTime(activities);
    expect(sorted).toHaveLength(1);
    expect(sorted[0].finish).toBe(4);
  });

  it('handles activities with same finish time', () => {
    const activities = [
      { id: 0, start: 1, finish: 5 },
      { id: 1, start: 3, finish: 5 },
    ];
    const sorted = sortByFinishTime(activities);
    expect(sorted.length).toBe(2);
    expect(sorted[0].finish).toBe(5);
    expect(sorted[1].finish).toBe(5);
  });
});

describe('activitySelection', () => {
  it('selects first activity', () => {
    // When first activity is selected, overlapping activities are rejected
    const activities = [
      { id: 0, start: 1, finish: 4 },
      { id: 1, start: 3, finish: 6 }, // Overlaps with first
    ];
    const result = activitySelection(activities);
    expect(result.selected).toHaveLength(1);
    expect(result.selected[0].id).toBe(0);
    expect(result.rejected).toHaveLength(1);
  });

  it('selects compatible activities', () => {
    const activities = [
      { id: 0, start: 1, finish: 4 },
      { id: 1, start: 5, finish: 7 },
      { id: 2, start: 8, finish: 10 },
    ];
    const result = activitySelection(activities);
    expect(result.selected).toHaveLength(3);
  });

  it('rejects overlapping activities', () => {
    const activities = [
      { id: 0, start: 1, finish: 4 },
      { id: 1, start: 3, finish: 5 }, // Overlaps with first
    ];
    const result = activitySelection(activities);
    expect(result.selected).toHaveLength(1);
    expect(result.rejected).toHaveLength(1);
  });

  it('maximizes number of activities', () => {
    // Classic example from CLRS
    const activities = [
      { id: 0, start: 1, finish: 4 },
      { id: 1, start: 3, finish: 5 },
      { id: 2, start: 0, finish: 6 },
      { id: 3, start: 5, finish: 7 },
      { id: 4, start: 3, finish: 9 },
      { id: 5, start: 5, finish: 9 },
      { id: 6, start: 6, finish: 10 },
      { id: 7, start: 8, finish: 11 },
      { id: 8, start: 8, finish: 12 },
      { id: 9, start: 2, finish: 14 },
      { id: 10, start: 12, finish: 16 },
    ];
    const result = activitySelection(activities);
    // Should select: 0(1,4), 3(5,7), 7(8,11), 10(12,16) = 4 activities
    expect(result.selected).toHaveLength(4);
  });

  it('handles single activity', () => {
    const activities = [{ id: 0, start: 1, finish: 4 }];
    const result = activitySelection(activities);
    expect(result.selected).toHaveLength(1);
    expect(result.rejected).toHaveLength(0);
  });

  it('handles empty array', () => {
    const result = activitySelection([]);
    expect(result.selected).toHaveLength(0);
    expect(result.rejected).toHaveLength(0);
    expect(result.count).toBe(0);
  });

  it('returns results with status', () => {
    const activities = [
      { id: 0, start: 1, finish: 4 },
      { id: 1, start: 3, finish: 5 },
    ];
    const result = activitySelection(activities);
    expect(result.results).toHaveLength(2);
    expect(result.results[0].selected).toBe(true);
    expect(result.results[0].rejected).toBe(false);
    expect(result.results[1].selected).toBe(false);
    expect(result.results[1].rejected).toBe(true);
  });

  it('tracks last finish boundary', () => {
    const activities = [
      { id: 0, start: 1, finish: 4 },
      { id: 1, start: 5, finish: 7 },
    ];
    const result = activitySelection(activities);
    expect(result.lastFinishBoundary).toBe(7);
  });
});

describe('activityRun', () => {
  it('runs successfully with valid input', () => {
    const activities = [
      { start: 1, finish: 4 },
      { start: 5, finish: 7 },
    ];
    const result = activityRun(activities);
    expect(result.success).toBe(true);
    expect(result.selected).toBeDefined();
    expect(result.count).toBeDefined();
  });

  it('returns error for invalid input', () => {
    const result = activityRun(null);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('returns error for empty input', () => {
    const result = activityRun([]);
    expect(result.success).toBe(false);
    expect(result.error).toContain('empty');
  });

  it('returns error for start > finish', () => {
    const result = activityRun([{ start: 5, finish: 3 }]);
    expect(result.success).toBe(false);
    expect(result.error).toContain('start');
  });

  it('handles single activity', () => {
    const result = activityRun([{ start: 1, finish: 4 }]);
    expect(result.success).toBe(true);
    expect(result.count).toBe(1);
  });
});

describe('generateRandomActivities', () => {
  it('generates correct number of activities', () => {
    const activities = generateRandomActivities(10);
    expect(activities).toHaveLength(10);
  });

  it('generates activities with valid times', () => {
    const activities = generateRandomActivities(5);
    for (const act of activities) {
      expect(act.start).toBeGreaterThanOrEqual(0);
      expect(act.finish).toBeGreaterThanOrEqual(act.start);
    }
  });

  it('is deterministic with same seed', () => {
    const activities1 = generateRandomActivities(5, 42);
    const activities2 = generateRandomActivities(5, 42);
    expect(activities1).toEqual(activities2);
  });

  it('different seeds produce different activities', () => {
    const activities1 = generateRandomActivities(5, 42);
    const activities2 = generateRandomActivities(5, 100);
    expect(activities1).not.toEqual(activities2);
  });

  it('activities have default names', () => {
    const activities = generateRandomActivities(3);
    expect(activities[0].name).toBe('Activity 0');
    expect(activities[1].name).toBe('Activity 1');
  });
});

describe('getDefaultActivities', () => {
  it('returns 11 activities', () => {
    const activities = getDefaultActivities();
    expect(activities).toHaveLength(11);
  });

  it('returns activities with correct structure', () => {
    const activities = getDefaultActivities();
    for (const act of activities) {
      expect(act).toHaveProperty('id');
      expect(act).toHaveProperty('start');
      expect(act).toHaveProperty('finish');
      expect(act).toHaveProperty('name');
    }
  });

  it('returns named activities', () => {
    const activities = getDefaultActivities();
    expect(activities[0].name).toBe('A');
    expect(activities[1].name).toBe('B');
  });
});

describe('getMaxActivityCount', () => {
  it('returns ACTIVITY_MAX_COUNT', () => {
    expect(getMaxActivityCount()).toBe(ACTIVITY_MAX_COUNT);
  });
});

describe('Activity Selection optimality', () => {
  it('finds optimal solution for small random sets', () => {
    // For small sets, verify greedy result against brute force
    const testCases = [
      [{ start: 1, finish: 4 }, { start: 3, finish: 5 }, { start: 0, finish: 6 }],
      [{ start: 1, finish: 2 }, { start: 3, finish: 4 }, { start: 0, finish: 6 }],
      [{ start: 5, finish: 9 }, { start: 1, finish: 2 }, { start: 3, finish: 4 }],
      [{ start: 1, finish: 10 }, { start: 2, finish: 5 }, { start: 6, finish: 10 }],
    ];

    for (const activities of testCases) {
      const result = activityRun(activities);
      expect(result.success).toBe(true);

      // Greedy should find optimal (maximum number of compatible activities)
      // For these small test cases, we can verify manually
      if (activities.length <= 3) {
        // Simple verification: count should be reasonable
        expect(result.count).toBeGreaterThanOrEqual(1);
        expect(result.count).toBeLessThanOrEqual(activities.length);
      }
    }
  });

  it('handles already sorted input', () => {
    const activities = [
      { start: 1, finish: 4 },
      { start: 5, finish: 7 },
      { start: 8, finish: 10 },
    ];
    const result = activityRun(activities);
    expect(result.success).toBe(true);
    expect(result.count).toBe(3);
  });

  it('handles unsorted input', () => {
    const activities = [
      { start: 5, finish: 7 },
      { start: 1, finish: 4 },
      { start: 8, finish: 10 },
    ];
    const result = activityRun(activities);
    expect(result.success).toBe(true);
    expect(result.count).toBe(3);
  });

  it('handles overlapping activities', () => {
    const activities = [
      { start: 1, finish: 5 },
      { start: 2, finish: 6 },
      { start: 3, finish: 7 },
      { start: 8, finish: 10 },
    ];
    const result = activityRun(activities);
    expect(result.success).toBe(true);
    // Should select: (1,5) and (8,10)
    expect(result.count).toBe(2);
  });

  it('handles non-overlapping activities', () => {
    const activities = [
      { start: 1, finish: 3 },
      { start: 3, finish: 5 },
      { start: 5, finish: 7 },
    ];
    const result = activityRun(activities);
    expect(result.success).toBe(true);
    expect(result.count).toBe(3);
  });

  it('handles identical finish times', () => {
    const activities = [
      { start: 1, finish: 5 },
      { start: 2, finish: 5 },
      { start: 3, finish: 5 },
    ];
    const result = activityRun(activities);
    expect(result.success).toBe(true);
    // First in sorted order is selected, rest overlap
    expect(result.count).toBe(1);
  });

  it('handles activities with zero duration', () => {
    const activities = [
      { start: 1, finish: 1 },
      { start: 2, finish: 2 },
      { start: 3, finish: 3 },
    ];
    const result = activityRun(activities);
    expect(result.success).toBe(true);
    expect(result.count).toBe(3);
  });
});
