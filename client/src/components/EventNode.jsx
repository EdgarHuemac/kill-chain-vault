import { Handle, Position } from "reactflow";
import { getPhase } from "../killchain.js";

export default function EventNode({ data }) {
  const { event, query, isMatch, dimmed, onSelect } = data;
  const phase = getPhase(event.phase);
  const Icon = phase.icon;
  const searching = !!(query && query.trim());
  const cmdPreview = event.command?.split("\n")[0] || "";

  return (
    <div className={`event-node ${dimmed ? "event-node-dim" : ""}`}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div className="event-node-title" title={event.title}>{event.title}</div>
      <button
        className={`event-node-box ${searching && isMatch ? "event-node-match" : ""}`}
        style={{ "--hue": phase.hue }}
        onClick={() => onSelect(event)}
        title={`${phase.key} — click for details`}
      >
        <Icon />
      </button>
      {cmdPreview && (
        <div className="event-node-cmd" title={event.command}>{cmdPreview}</div>
      )}
      <div className="event-node-phase">{phase.short}</div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}
