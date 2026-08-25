/**
 * Generic algorithm event log.
 *
 * Algorithms emit plain, serializable, deterministic events; UI projectors
 * turn event sequences into debugger/visualizer step snapshots. Algorithm
 * code never touches React, the DOM, or snapshot schemas directly.
 */
export function createEventCollector() {
  const events = [];
  return {
    events,
    emit(type, data = {}) {
      events.push({ type, ...data });
    },
  };
}
