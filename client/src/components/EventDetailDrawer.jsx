import { useState } from "react";
import { X, Copy, Check, Clock } from "lucide-react";
import { getPhase } from "../killchain.js";
import "./EventDetailDrawer.css";

export default function EventDetailDrawer({ event, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!event) return null;
  const phase = getPhase(event.phase);
  const Icon = phase.icon;

  function copyCommand() {
    navigator.clipboard?.writeText(event.command || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <span className="phase-dot phase-dot-lg" style={{ "--hue": phase.hue }}>
            <Icon />
          </span>
          <div>
            <div className="badge" style={{ borderColor: phase.hue, color: phase.hue }}>
              {phase.key}
            </div>
            <h2 className="drawer-title">{event.title}</h2>
          </div>
          <button className="btn btn-ghost btn-icon drawer-close" onClick={onClose}>
            <X />
          </button>
        </div>

        {event.datetime && (
          <div className="drawer-meta">
            <Clock />
            {new Date(event.datetime).toLocaleString()}
          </div>
        )}

        {event.description && (
          <section className="drawer-section">
            <h4>Description</h4>
            <p>{event.description}</p>
          </section>
        )}

        {event.command && (
          <section className="drawer-section">
            <div className="drawer-section-head">
              <h4>Command</h4>
              <button className="btn btn-ghost code-copy" onClick={copyCommand}>
                {copied ? <Check /> : <Copy />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="code-block mono">
              <code>{event.command}</code>
            </pre>
          </section>
        )}

        {event.comments && (
          <section className="drawer-section">
            <h4>Comments</h4>
            <p className="drawer-comments">{event.comments}</p>
          </section>
        )}
      </aside>
    </div>
  );
}
