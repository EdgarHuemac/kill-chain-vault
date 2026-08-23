import { useState } from "react";
import { ArrowLeft, Search, ShieldHalf, GitBranch } from "lucide-react";
import GraphView from "./GraphView.jsx";
import TimelineLog from "./TimelineLog.jsx";
import EventDetailDrawer from "./EventDetailDrawer.jsx";
import { eventMatches } from "../search.js";
import "./EngagementView.css";

const TYPE_LABEL = {
  CTF: "CTF",
  PENTEST: "Pentest",
  CYBERATTACK: "Cyberattack",
  RESEARCH: "Research",
};

export default function EngagementView({ engagement, onBack }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const events = engagement.events || [];
  const matchCount = events.filter((e) => eventMatches(e, query)).length;

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="btn btn-ghost btn-icon" onClick={onBack} title="Back to dashboard">
          <ArrowLeft />
        </button>
        <div className="brand" onClick={onBack} style={{ cursor: "pointer" }}>
          <span className="brand-mark">
            <ShieldHalf />
          </span>
        </div>
        <div className="eng-view-heading">
          <span className="badge">{TYPE_LABEL[engagement.type] || engagement.type}</span>
          <h1>{engagement.title}</h1>
        </div>
        <div className="spacer" />
        <div className="search-input-wrap">
          <Search />
          <input
            className="search-input"
            placeholder="Search this engagement — nmap, exploit, phase…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </header>

      <main className="page eng-view-page">
        {query.trim() && (
          <div className="match-summary">
            <GitBranch /> {matchCount} of {events.length} events match “{query}”
          </div>
        )}

        <section className="graph-panel">
          <GraphView events={events} query={query} onSelect={setSelected} />
        </section>

        <section className="timeline-panel">
          <h3 className="section-label">Timeline log</h3>
          {events.length === 0 ? (
            <div className="empty-state">This engagement has no events yet.</div>
          ) : (
            <TimelineLog events={events} query={query} />
          )}
        </section>
      </main>

      <EventDetailDrawer event={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
