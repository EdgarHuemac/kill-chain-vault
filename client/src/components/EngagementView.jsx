import { useRef, useState, useEffect } from "react";
import { ArrowLeft, Search, ShieldHalf, GitBranch, ArrowRight, ArrowDown, FileDown, Loader2 } from "lucide-react";
import GraphView from "./GraphView.jsx";
import TimelineLog from "./TimelineLog.jsx";
import EventDetailDrawer from "./EventDetailDrawer.jsx";
import { eventMatches } from "../search.js";
import "./EngagementView.css";

const TYPE_LABEL = { CTF: "CTF", PENTEST: "Pentest", CYBERATTACK: "Cyberattack", RESEARCH: "Research" };

export default function EngagementView({ engagement, initialEventId, onBack }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [direction, setDirection] = useState("LR");
  const [downloading, setDownloading] = useState(false);

  async function handleDownloadPdf() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/engagements/${engagement.id}/pdf`);
      if (!res.ok) throw new Error("Server error");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${engagement.title.replace(/[^a-zA-Z0-9 \-_.]/g, "_")} - Report.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setDownloading(false);
    }
  }
  const timelineRef = useRef(null);
  const events = engagement.events || [];
  const matchCount = events.filter((e) => eventMatches(e, query)).length;

  // If opened from a search result, scroll to the timeline section
  useEffect(() => {
    if (!initialEventId) return;
    setTimeout(() => {
      timelineRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }, [initialEventId]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="btn btn-ghost btn-icon" onClick={onBack} title="Back to dashboard">
          <ArrowLeft />
        </button>
        <div className="brand" onClick={onBack}>
          <span className="brand-mark"><ShieldHalf /></span>
        </div>
        <div className="eng-view-heading">
          <span className="badge">{TYPE_LABEL[engagement.type] || engagement.type}</span>
          <h1>{engagement.title}</h1>
        </div>
        <div className="spacer" />
        <button
          className="btn btn-ghost pdf-btn"
          onClick={handleDownloadPdf}
          disabled={downloading}
          title="Download PDF report"
        >
          {downloading ? <Loader2 className="spin" /> : <FileDown />}
          {downloading ? "Generating…" : "PDF Report"}
        </button>
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
            <GitBranch /> {matchCount} of {events.length} events match "{query}"
          </div>
        )}

        <section className="graph-panel">
          <div className="graph-toolbar">
            <span className="section-label" style={{ margin: 0 }}>Graph</span>
            <span className="graph-event-count">{events.length} events</span>
            <div className="spacer" />
            <div className="layout-toggle">
              <button
                className={`btn btn-ghost btn-icon layout-btn ${direction === "LR" ? "layout-btn-active" : ""}`}
                onClick={() => setDirection("LR")}
                title="Left → Right layout"
              >
                <ArrowRight />
              </button>
              <button
                className={`btn btn-ghost btn-icon layout-btn ${direction === "TB" ? "layout-btn-active" : ""}`}
                onClick={() => setDirection("TB")}
                title="Top → Bottom layout"
              >
                <ArrowDown />
              </button>
            </div>
          </div>
          <div className="graph-canvas">
            <GraphView events={events} query={query} onSelect={setSelected} direction={direction} />
          </div>
        </section>

        <section className="timeline-panel" ref={timelineRef}>
          <h3 className="section-label">Timeline log</h3>
          {events.length === 0 ? (
            <div className="empty-state">This engagement has no events yet.</div>
          ) : (
            <TimelineLog events={events} query={query} initialOpenEventId={initialEventId} />
          )}
        </section>
      </main>

      <EventDetailDrawer event={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
