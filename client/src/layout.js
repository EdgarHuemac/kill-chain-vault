// Positions events left-to-right by "distance from a root event" (depth),
// and stacks branching events vertically within the same column so nothing
// overlaps. This keeps single continuous chains as a clean straight line,
// while still handling forks/merges gracefully.
const COLUMN_WIDTH = 240;
const ROW_HEIGHT = 150;

export function layoutEvents(events) {
  const byId = new Map(events.map((e) => [e.id, e]));
  const parentsOf = new Map(events.map((e) => [e.id, []]));

  events.forEach((e) => {
    (e.connections || []).forEach((childId) => {
      if (parentsOf.has(childId)) parentsOf.get(childId).push(e.id);
    });
  });

  const depth = new Map();
  function computeDepth(id, seen) {
    if (depth.has(id)) return depth.get(id);
    if (seen.has(id)) return 0; // cycle guard
    seen.add(id);
    const parents = parentsOf.get(id) || [];
    const d = parents.length
      ? Math.max(...parents.map((p) => computeDepth(p, new Set(seen)))) + 1
      : 0;
    depth.set(id, d);
    return d;
  }
  events.forEach((e) => computeDepth(e.id, new Set()));

  const columns = new Map();
  events.forEach((e) => {
    const d = depth.get(e.id) ?? 0;
    if (!columns.has(d)) columns.set(d, []);
    columns.get(d).push(e);
  });

  const positions = new Map();
  [...columns.keys()]
    .sort((a, b) => a - b)
    .forEach((col) => {
      columns.get(col).forEach((e, laneIdx) => {
        positions.set(e.id, {
          x: col * COLUMN_WIDTH,
          y: laneIdx * ROW_HEIGHT,
        });
      });
    });

  return positions;
}

export { byIdMap };
function byIdMap(events) {
  return new Map(events.map((e) => [e.id, e]));
}
