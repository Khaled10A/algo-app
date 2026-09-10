/**
 * Activity Selection implementation.
 *
 * Standard greedy activity selection algorithm.
 * Time: O(n log n) for sorting, O(n) for selection = O(n log n) total.
 * Space: O(n) for storing activities and selected set.
 *
 * This module also provides a `debug(activities)` function that generates a full
 * event stream for visualization in the debugger tab.
 */

// -------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------

/** @typedef {{ id: number; start: number; finish: number; name?: string }} Activity */

/** @typedef {{ id: number; start: number; finish: number; selected: boolean; rejected: boolean; reason?: string }} ActivityWithStatus */

// -------------------------------------------------------------------------
// Validation
// -------------------------------------------------------------------------

/** Maximum activity count for visualization. */
export const ACTIVITY_MAX_COUNT = 50;

/**
 * Validate activity selection input.
 * @param {Array<{ start: number; finish: number }>} activities
 * @returns {{ valid: boolean; reason: string | null; processed: Array<Activity> }}
 */
export function validateActivityInput(activities) {
  if (!Array.isArray(activities)) {
    return { valid: false, reason: 'Input must be an array of activities.', processed: [] };
  }

  if (activities.length === 0) {
    return { valid: false, reason: 'Input is empty.', processed: [] };
  }

  if (activities.length > ACTIVITY_MAX_COUNT) {
    return {
      valid: false,
      reason: `Too many activities (${activities.length}). Maximum is ${ACTIVITY_MAX_COUNT} for visualization performance.`,
      processed: [],
    };
  }

  const processed = [];
  for (let i = 0; i < activities.length; i++) {
    const act = activities[i];
    if (!act || typeof act.start !== 'number' || typeof act.finish !== 'number') {
      return {
        valid: false,
        reason: `Activity at index ${i} is invalid. Each activity must have numeric start and finish times.`,
        processed: [],
      };
    }
    if (act.start < 0 || act.finish < 0) {
      return {
        valid: false,
        reason: `Activity at index ${i} has negative times. Times must be non-negative.`,
        processed: [],
      };
    }
    if (act.start > act.finish) {
      return {
        valid: false,
        reason: `Activity at index ${i} has start (${act.start}) > finish (${act.finish}).`,
        processed: [],
      };
    }
    // Add unique ID
    processed.push({
      id: i,
      start: act.start,
      finish: act.finish,
      name: act.name || `Activity ${i}`,
    });
  }

  return { valid: true, reason: null, processed };
}

/** @returns {number} */
export function getMaxActivityCount() {
  return ACTIVITY_MAX_COUNT;
}

// -------------------------------------------------------------------------
// Sorting
// -------------------------------------------------------------------------

/**
 * Sort activities by finish time (ascending).
 * @param {Array<Activity>} activities
 * @returns {Array<Activity>}
 */
export function sortByFinishTime(activities) {
  return [...activities].sort((a, b) => a.finish - b.finish);
}

// -------------------------------------------------------------------------
// Algorithm
// -------------------------------------------------------------------------

/**
 * Run Activity Selection greedy algorithm.
 * @param {Array<Activity>} activities
 * @returns {{ selected: Array<Activity>; rejected: Array<ActivityWithStatus>; count: number }}
 */
export function activitySelection(activities) {
  if (activities.length === 0) {
    return { selected: [], rejected: [], count: 0 };
  }

  const sorted = sortByFinishTime(activities);
  const selected = [];
  const rejected = [];
  const results = [];

  // Add first activity
  const first = sorted[0];
  selected.push(first);

  // Track with status for visualization
  results.push({
    ...first,
    selected: true,
    rejected: false,
    reason: 'First activity selected',
  });

  let lastFinish = first.finish;

  // Consider remaining activities
  for (let i = 1; i < sorted.length; i++) {
    const act = sorted[i];

    if (act.start >= lastFinish) {
      // Compatible - select it
      selected.push(act);
      lastFinish = act.finish;
      results.push({
        ...act,
        selected: true,
        rejected: false,
        reason: `Compatible (start ${act.start} >= last finish ${lastFinish})`,
      });
    } else {
      // Incompatible - reject it
      rejected.push(act);
      results.push({
        ...act,
        selected: false,
        rejected: true,
        reason: `Incompatible (start ${act.start} < last finish ${lastFinish})`,
      });
    }
  }

  return {
    selected,
    rejected,
    results,
    count: selected.length,
    lastFinishBoundary: lastFinish,
  };
}

// -------------------------------------------------------------------------
// Debug event generation
// -------------------------------------------------------------------------

import {
  createGreedyEvent,
  createGreedyCollector,
} from './greedyEvents';
import { projectGreedyEvents } from './greedySteps';

/**
 * Get activities with status for snapshot.
 * @param {Array<ActivityWithStatus>} results
 * @returns {Array<ActivityWithStatus>}
 */
function getActivitiesWithStatus(results) {
  return results.map(r => ({
    id: r.id,
    start: r.start,
    finish: r.finish,
    name: r.name,
    selected: r.selected,
    rejected: r.rejected,
    reason: r.reason,
  }));
}

/**
 * Debug function that generates a full event stream for visualization.
 *
 * @param {Array<{ start: number; finish: number }>} activities
 * @returns {Array<object>} event stream for projector
 */
export function activityDebug(activities) {
  const collector = createGreedyCollector();
  let stepCounter = 1;

  // Validate input
  const validation = validateActivityInput(activities);
  if (!validation.valid) {
    return [createGreedyEvent({
      type: 'complete',
      eventId: `e-1`,
      step: 1,
      subproblem: 'error',
      action: validation.reason,
      stateSnapshot: { error: validation.reason },
      meta: { solution: { error: validation.reason } },
    })];
  }

  const inputActivities = validation.processed;
  const totalCount = inputActivities.length;

  // Step 1: Input received
  collector.emit('enter', {
    counter: stepCounter++,
    subproblem: 'input received',
    action: `enter: ${totalCount} activities received`,
    stateSnapshot: {
      inputActivities: inputActivities.map(a => ({ id: a.id, start: a.start, finish: a.finish, name: a.name })),
      totalCount,
    },
    meta: {
      activities: inputActivities.map(a => ({ id: a.id, start: a.start, finish: a.finish, name: a.name })),
      totalCount,
    },
  });

  // Step 2: Sort by finish time
  const sorted = sortByFinishTime(inputActivities);
  collector.emit('update', {
    counter: stepCounter++,
    subproblem: 'sorting by finish time',
    action: `update: sorted ${totalCount} activities by finish time`,
    stateSnapshot: {
      sortedActivities: sorted.map(a => ({ id: a.id, start: a.start, finish: a.finish, name: a.name })),
      totalCount,
    },
    meta: {
      sortedActivities: sorted.map(a => ({ id: a.id, start: a.start, finish: a.finish, name: a.name })),
      sortOrder: sorted.map(a => a.id),
    },
  });

  // Step 3: Select first activity
  const first = sorted[0];
  collector.emit('select', {
    counter: stepCounter++,
    subproblem: 'select first activity',
    action: `select: ${first.name} (finish ${first.finish}) - first activity`,
    stateSnapshot: {
      sortedActivities: sorted.map(a => ({ id: a.id, start: a.start, finish: a.finish, name: a.name })),
      selectedActivities: [{ id: first.id, start: first.start, finish: first.finish, name: first.name }],
      lastFinish: first.finish,
      currentActivity: { id: first.id, start: first.start, finish: first.finish, name: first.name },
      totalCount,
    },
    meta: {
      selected: { id: first.id, start: first.start, finish: first.finish, name: first.name },
      lastFinish: first.finish,
    },
  });

  // Step 4: Consider remaining activities
  const selectedActivities = [first];
  const rejectedActivities = [];
  let lastFinish = first.finish;
  const results = [{
    ...first,
    selected: true,
    rejected: false,
    reason: 'First activity selected',
  }];

  for (let i = 1; i < sorted.length; i++) {
    const act = sorted[i];

    // Emit compare event
    collector.emit('compare', {
      counter: stepCounter++,
      subproblem: `consider ${act.name}`,
      action: `compare: ${act.name} (start ${act.start}, finish ${act.finish}) vs last finish ${lastFinish}`,
      stateSnapshot: {
        sortedActivities: sorted.map(a => ({ id: a.id, start: a.start, finish: a.finish, name: a.name })),
        selectedActivities: selectedActivities.map(a => ({ id: a.id, start: a.start, finish: a.finish, name: a.name })),
        rejectedActivities: rejectedActivities.map(a => ({ id: a.id, start: a.start, finish: a.finish, name: a.name })),
        currentActivity: { id: act.id, start: act.start, finish: act.finish, name: act.name },
        lastFinish,
        totalCount,
      },
      meta: {
        comparing: {
          activity: { id: act.id, start: act.start, finish: act.finish, name: act.name },
          lastFinish,
          compatible: act.start >= lastFinish,
        },
      },
    });

    if (act.start >= lastFinish) {
      // Select compatible activity
      selectedActivities.push(act);
      lastFinish = act.finish;
      results.push({
        ...act,
        selected: true,
        rejected: false,
        reason: `Compatible (start ${act.start} >= last finish ${act.finish - (act.finish - act.start)})`,
      });

      collector.emit('select', {
        counter: stepCounter++,
        subproblem: `select ${act.name}`,
        action: `select: ${act.name} (start ${act.start} >= last finish ${lastFinish - (act.finish - act.start)})`,
        stateSnapshot: {
          sortedActivities: sorted.map(a => ({ id: a.id, start: a.start, finish: a.finish, name: a.name })),
          selectedActivities: selectedActivities.map(a => ({ id: a.id, start: a.start, finish: a.finish, name: a.name })),
          rejectedActivities: rejectedActivities.map(a => ({ id: a.id, start: a.start, finish: a.finish, name: a.name })),
          currentActivity: { id: act.id, start: act.start, finish: act.finish, name: act.name },
          lastFinish,
          totalCount,
        },
        meta: {
          selected: { id: act.id, start: act.start, finish: act.finish, name: act.name },
          lastFinish,
          reason: 'Compatible activity',
        },
      });
    } else {
      // Reject incompatible activity
      rejectedActivities.push(act);
      results.push({
        ...act,
        selected: false,
        rejected: true,
        reason: `Incompatible (start ${act.start} < last finish ${lastFinish})`,
      });

      collector.emit('reject', {
        counter: stepCounter++,
        subproblem: `reject ${act.name}`,
        action: `reject: ${act.name} (start ${act.start} < last finish ${lastFinish})`,
        stateSnapshot: {
          sortedActivities: sorted.map(a => ({ id: a.id, start: a.start, finish: a.finish, name: a.name })),
          selectedActivities: selectedActivities.map(a => ({ id: a.id, start: a.start, finish: a.finish, name: a.name })),
          rejectedActivities: rejectedActivities.map(a => ({ id: a.id, start: a.start, finish: a.finish, name: a.name })),
          currentActivity: { id: act.id, start: act.start, finish: act.finish, name: act.name },
          lastFinish,
          totalCount,
        },
        meta: {
          rejected: { id: act.id, start: act.start, finish: act.finish, name: act.name },
          lastFinish,
          reason: 'Overlaps with last selected activity',
        },
      });
    }
  }

  // Step 5: Complete
  collector.emit('complete', {
    counter: stepCounter++,
    subproblem: 'complete',
    action: `complete: selected ${selectedActivities.length} of ${totalCount} activities`,
    stateSnapshot: {
      sortedActivities: sorted.map(a => ({ id: a.id, start: a.start, finish: a.finish, name: a.name })),
      selectedActivities: selectedActivities.map(a => ({ id: a.id, start: a.start, finish: a.finish, name: a.name })),
      rejectedActivities: rejectedActivities.map(a => ({ id: a.id, start: a.start, finish: a.finish, name: a.name })),
      results: getActivitiesWithStatus(results),
      selectedCount: selectedActivities.length,
      rejectedCount: rejectedActivities.length,
      lastFinish,
      totalCount,
    },
    meta: {
      solution: {
        selected: selectedActivities.map(a => ({ id: a.id, start: a.start, finish: a.finish, name: a.name })),
        rejected: rejectedActivities.map(a => ({ id: a.id, start: a.start, finish: a.finish, name: a.name })),
        selectedCount: selectedActivities.length,
        rejectedCount: rejectedActivities.length,
        totalCount,
      },
    },
  });

  return collector.events;
}

/**
 * Steps function that projects debug events into debugger snapshots.
 *
 * @param {Array<{ start: number; finish: number }>} activities
 * @returns {Array<object>} debugger snapshots
 */
export function activitySteps(activities) {
  const events = activityDebug(activities);
  return projectGreedyEvents(events);
}

/**
 * Run function that executes Activity Selection and returns results.
 *
 * @param {Array<{ start: number; finish: number }>} activities
 * @returns {{ success: boolean; error?: string; selected?: Array<Activity>; rejected?: Array<Activity>; count?: number }}
 */
export function activityRun(activities) {
  const validation = validateActivityInput(activities);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.reason,
    };
  }

  const result = activitySelection(validation.processed);
  return {
    success: true,
    selected: result.selected,
    rejected: result.rejected,
    count: result.count,
    results: result.results,
  };
}

// -------------------------------------------------------------------------
// Utility: generate random activities
// -------------------------------------------------------------------------

/**
 * Generate random activities for demonstration.
 * @param {number} count - number of activities to generate
 * @param {number} seed - seed for deterministic generation
 * @returns {Array<Activity>}
 */
export function generateRandomActivities(count, seed = 42) {
  // Simple seeded PRNG (mulberry32)
  let state = seed;
  const next = () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const activities = [];
  const maxTime = 100;

  for (let i = 0; i < count; i++) {
    const duration = 5 + Math.floor(next() * 20);
    const start = Math.floor(next() * (maxTime - duration));
    const finish = start + duration;
    activities.push({
      id: i,
      start,
      finish,
      name: `Activity ${i}`,
    });
  }

  return activities;
}

/**
 * Generate a deterministic default dataset.
 * @returns {Array<Activity>}
 */
export function getDefaultActivities() {
  return [
    { id: 0, start: 1, finish: 4, name: 'A' },
    { id: 1, start: 3, finish: 5, name: 'B' },
    { id: 2, start: 0, finish: 6, name: 'C' },
    { id: 3, start: 5, finish: 7, name: 'D' },
    { id: 4, start: 3, finish: 9, name: 'E' },
    { id: 5, start: 5, finish: 9, name: 'F' },
    { id: 6, start: 6, finish: 10, name: 'G' },
    { id: 7, start: 8, finish: 11, name: 'H' },
    { id: 8, start: 8, finish: 12, name: 'I' },
    { id: 9, start: 2, finish: 14, name: 'J' },
    { id: 10, start: 12, finish: 16, name: 'K' },
  ];
}
