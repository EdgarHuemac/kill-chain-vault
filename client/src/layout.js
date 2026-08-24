import dagre from "@dagrejs/dagre";

export const NODE_WIDTH = 190;
export const NODE_HEIGHT = 110;

export function layoutEvents(events, direction = "LR") {
  if (!events || events.length === 0) return new Map();

  const g = new dagre.graphlib.Graph({ multigraph: false });
  g.setGraph({
    rankdir: direction,
    nodesep: direction === "LR" ? 55 : 100,
    ranksep: direction === "LR" ? 130 : 90,
    marginx: 40,
    marginy: 40,
  });
  g.setDefaultEdgeLabel(() => ({}));

  const eventIds = new Set(events.map((e) => e.id));

  events.forEach((event) => {
    g.setNode(event.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  events.forEach((event) => {
    (event.connections || []).forEach((targetId) => {
      if (eventIds.has(targetId) && event.id !== targetId) {
        try { g.setEdge(event.id, targetId); } catch {}
      }
    });
  });

  dagre.layout(g);

  const positions = new Map();
  events.forEach((event) => {
    const node = g.node(event.id);
    positions.set(event.id, node
      ? { x: node.x - NODE_WIDTH / 2, y: node.y - NODE_HEIGHT / 2 }
      : { x: 0, y: 0 }
    );
  });

  return positions;
}
