import { useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import EventNode from "./EventNode.jsx";
import { layoutEvents, NODE_WIDTH, NODE_HEIGHT } from "../layout.js";
import { eventMatches } from "../search.js";
import { getPhase } from "../killchain.js";
import { useTheme } from "../ThemeContext.jsx";
import "./GraphView.css";

const nodeTypes = { eventNode: EventNode };

// Distinct, subtle edge palette for branching paths
const EDGE_PALETTE = ["#5aa9ff","#ff5c5c","#4ade80","#f5a623","#c084fc","#37d6c7","#ff9f43"];

function FlowInner({ events, query, onSelect, direction }) {
  const { fitView } = useReactFlow();
  const { theme } = useTheme();

  const { nodes, edges } = useMemo(() => {
    const positions = layoutEvents(events, direction);
    const searching = !!(query && query.trim());

    // Count outgoing edges per node to assign colors
    const outCounts = new Map();
    events.forEach((ev) => {
      (ev.connections || []).forEach((tid) => {
        if (!outCounts.has(ev.id)) outCounts.set(ev.id, []);
        outCounts.get(ev.id).push(tid);
      });
    });

    const nodes = events.map((event) => {
      const isMatch = eventMatches(event, query);
      return {
        id: event.id,
        type: "eventNode",
        position: positions.get(event.id) || { x: 0, y: 0 },
        data: { event, query, isMatch, dimmed: searching && !isMatch, onSelect },
        draggable: true,
        connectable: false,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      };
    });

    const edges = [];
    events.forEach((event) => {
      const targets = outCounts.get(event.id) || [];
      const isBranching = targets.length > 1;

      targets.forEach((targetId, idx) => {
        const targetEvent = events.find((e) => e.id === targetId);
        if (!targetEvent) return;

        const bothMatch = !searching || (eventMatches(event, query) && eventMatches(targetEvent, query));
        // Use target phase color for branching edges so each path is distinct
        const targetPhase = getPhase(targetEvent.phase);
        const edgeColor = isBranching
          ? targetPhase.hue
          : bothMatch ? "#404040" : "#1e1e1e";

        edges.push({
          id: `${event.id}->${targetId}`,
          source: event.id,
          target: targetId,
          type: "bezier",
          animated: false,
          style: { stroke: edgeColor, strokeWidth: isBranching ? 2 : 1.5, opacity: bothMatch ? 1 : 0.25 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: edgeColor,
            width: 14,
            height: 14,
          },
        });
      });
    });

    return { nodes, edges };
  }, [events, query, onSelect, direction]);

  const onInit = useCallback(() => {
    setTimeout(() => fitView({ padding: 0.25, maxZoom: 1.1 }), 50);
  }, [fitView]);

  return (
    <ReactFlow
      key={direction}
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onInit={onInit}
      fitView
      fitViewOptions={{ padding: 0.25, maxZoom: 1.1 }}
      proOptions={{ hideAttribution: true }}
      nodesConnectable={false}
      nodesDraggable={true}
      elementsSelectable={true}
      minZoom={0.15}
      maxZoom={2}
    >
      <Background color={theme === "dark" ? "#111111" : "#e0e0e0"} gap={24} size={1.2} />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

export default function GraphView({ events, query, onSelect, direction = "LR" }) {
  return (
    <div className="graph-view">
      <ReactFlowProvider>
        <FlowInner events={events} query={query} onSelect={onSelect} direction={direction} />
      </ReactFlowProvider>
    </div>
  );
}
