import { Handle, Position } from "reactflow";
import { getPhase } from "../killchain.js";

export default function EventNode({ data }) {
  const { event, query, isMatch, dimmed, onSelect } = data;
  const phase = getPhase(event.phase);
  const Icon = phase.icon;
  const searching = !!(query && query.trim());

  return (
    <div className={`event-node ${dimmed ? "event-node-dim" : ""}`}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div className="event-node-title" title={event.title}>
        {event.title}
      </div>
      <button
        className={`event-node-box ${searching && isMatch ? "event-node-match" : ""}`}
        style={{ "--hue": phase.hue }}
        onClick={() => onSelect(event)}
        title={`${phase.key} — click for details`}
      >
        <Icon />
      </button>
      <div className="event-node-phase">{phase.short}</div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}
