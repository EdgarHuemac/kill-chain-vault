import { useEffect, useRef, useState } from "react";
import { ChevronRight, Clock } from "lucide-react";
import { getPhase } from "../killchain.js";
import { eventMatches } from "../search.js";
import Highlight from "./Highlight.jsx";
import CopyButton from "./CopyButton.jsx";
import "./TimelineLog.css";

function sortedEvents(events) {
  return [...events].sort((a, b) => {
    if (a.datetime && b.datetime) return new Date(a.datetime) - new Date(b.datetime);
    if (a.datetime) return -1;
    if (b.datetime) return 1;
    return 0;
  });
}

export default function TimelineLog({ events, query, initialOpenEventId }) {
  const [openId, setOpenId] = useState(initialOpenEventId || null);
  const rowRefs = useRef({});
  const ordered = sortedEvents(events);
  const searching = !!(query && query.trim());

  // When arriving from a search result click, open + scroll to that event
  useEffect(() => {
    if (!initialOpenEventId) return;
    setOpenId(initialOpenEventId);
    const tryScroll = () => {
      const el = rowRefs.current[initialOpenEventId];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    // Small delay so the DOM is laid out
    setTimeout(tryScroll, 180);
  }, [initialOpenEventId]);

  return (
    <div className="timeline-log">
      {ordered.map((event, i) => {
        const phase = getPhase(event.phase);
        const Icon = phase.icon;
        const isMatch = eventMatches(event, query);
        const isOpen = openId === event.id;

        return (
          <div
            key={event.id}
            ref={(el) => { rowRefs.current[event.id] = el; }}
            className={`log-row ${searching && !isMatch ? "log-row-dim" : ""} ${isOpen ? "log-row-open" : ""}`}
          >
            <button
              className="log-row-header"
              onClick={() => setOpenId(isOpen ? null : event.id)}
            >
              <ChevronRight className={`log-chevron ${isOpen ? "log-chevron-open" : ""}`} />
              <span className="log-index mono">{String(i + 1).padStart(2, "0")}</span>
              <span className="phase-dot" style={{ "--hue": phase.hue }}>
                <Icon />
              </span>
              <span className="log-phase">{phase.short}</span>
              <span className="log-title">
                <Highlight text={event.title} query={query} />
              </span>
              <span className="log-cmd mono">
                <Highlight text={event.command?.split("\n")[0] || ""} query={query} />
              </span>
              {event.datetime && (
                <span className="log-time">
                  <Clock /> {new Date(event.datetime).toLocaleString()}
                </span>
              )}
              {event.command && (
                <CopyButton text={event.command} label={false} className="log-copy-btn" />
              )}
            </button>

            {isOpen && (
              <div className="log-row-body">
                {event.description && (
                  <p><Highlight text={event.description} query={query} /></p>
                )}
                {event.command && (
                  <div className="log-code-wrap">
                    <div className="log-code-header">
                      <span className="log-code-label mono">command</span>
                      <CopyButton text={event.command} />
                    </div>
                    <pre className="code-block mono">
                      <code><Highlight text={event.command} query={query} /></code>
                    </pre>
                  </div>
                )}
                {event.comments && (
                  <p className="log-comments">
                    <Highlight text={event.comments} query={query} />
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
