import { eventMatches } from "../search.js";
import { getPhase } from "../killchain.js";
import Highlight from "./Highlight.jsx";
import { CornerDownRight } from "lucide-react";

export default function GlobalSearchResults({ engagements, query, onOpen }) {
  const rows = [];
  for (const eng of engagements) {
    for (const ev of eng.events || []) {
      if (eventMatches(ev, query)) {
        rows.push({ eng, ev });
      }
    }
  }

  if (rows.length === 0) {
    return (
      <div className="empty-state">
        <h3>No matches</h3>
        <p>Nothing in your archive matches “{query}”.</p>
      </div>
    );
  }

  return (
    <div className="global-results">
      <div className="global-results-count">
        {rows.length} matching event{rows.length === 1 ? "" : "s"} across {engagements.length}{" "}
        engagement{engagements.length === 1 ? "" : "s"}
      </div>
      {rows.map(({ eng, ev }, i) => {
        const phase = getPhase(ev.phase);
        const Icon = phase.icon;
        return (
          <button
            key={`${eng.id}-${ev.id}-${i}`}
            className="global-result-row"
            onClick={() => onOpen(eng.id)}
          >
            <span className="phase-dot" style={{ "--hue": phase.hue }}>
              <Icon />
            </span>
            <div className="global-result-body">
              <div className="global-result-title">
                <Highlight text={ev.title} query={query} />
              </div>
              <div className="global-result-cmd mono">
                <Highlight text={ev.command} query={query} />
              </div>
            </div>
            <div className="global-result-source">
              <CornerDownRight />
              <Highlight text={eng.title} query={query} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
