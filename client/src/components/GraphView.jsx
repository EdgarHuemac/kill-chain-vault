import { useMemo } from "react";
import ReactFlow, { Background, Controls, MarkerType } from "reactflow";
import "reactflow/dist/style.css";
import EventNode from "./EventNode.jsx";
import { layoutEvents } from "../layout.js";
import { eventMatches } from "../search.js";
import "./GraphView.css";

const nodeTypes = { eventNode: EventNode };

export default function GraphView({ events, query, onSelect }) {
  const { nodes, edges } = useMemo(() => {
    const positions = layoutEvents(events);
    const searching = !!(query && query.trim());

    const nodes = events.map((event) => {
      const isMatch = eventMatches(event, query);
      return {
        id: event.id,
        type: "eventNode",
        position: positions.get(event.id) || { x: 0, y: 0 },
        data: {
          event,
          query,
          isMatch,
          dimmed: searching && !isMatch,
          onSelect,
        },
        draggable: true,
        connectable: false,
      };
    });

    const edges = [];
    events.forEach((event) => {
      (event.connections || []).forEach((targetId) => {
        const targetEvent = events.find((e) => e.id === targetId);
        if (!targetEvent) return;
        const bothMatch =
          !searching || (eventMatches(event, query) && eventMatches(targetEvent, query));
        edges.push({
          id: `${event.id}->${targetId}`,
          source: event.id,
          target: targetId,
          type: "smoothstep",
          animated: false,
          style: {
            stroke: bothMatch ? "#3a3a3a" : "#1c1c1c",
            strokeWidth: 1.5,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: bothMatch ? "#3a3a3a" : "#1c1c1c",
            width: 16,
            height: 16,
          },
        });
      });
    });

    return { nodes, edges };
  }, [events, query, onSelect]);

  return (
    <div className="graph-view">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
        nodesDraggable={true}
        elementsSelectable={true}
        minZoom={0.3}
        maxZoom={1.8}
      >
        <Background color="#161616" gap={22} size={1.5} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
