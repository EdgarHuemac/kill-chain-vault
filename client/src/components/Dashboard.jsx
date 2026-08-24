import { useMemo, useState } from "react";
import { Search, ShieldHalf, RefreshCw } from "lucide-react";
import ImportButton from "./ImportButton.jsx";
import EngagementCard from "./EngagementCard.jsx";
import GlobalSearchResults from "./GlobalSearchResults.jsx";
import StatsPanel from "./StatsPanel.jsx";
import { engagementMatches } from "../search.js";
import "./Dashboard.css";

export default function Dashboard({ engagements, loading, error, onOpen, onRefresh }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => engagements.filter((e) => engagementMatches(e, query)),
    [engagements, query]
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark"><ShieldHalf /></span>
          KILL CHAIN VAULT
          <span className="brand-sub">engagement archive</span>
        </div>
        <div className="search-input-wrap">
          <Search />
          <input
            className="search-input"
            placeholder="Search all engagements — commands, titles, phases, descriptions…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="spacer" />
        <button className="btn btn-ghost btn-icon" title="Refresh" onClick={onRefresh}>
          <RefreshCw />
        </button>
        <ImportButton onImported={onRefresh} />
      </header>

      <main className="page">
        {!loading && engagements.length > 0 && !query.trim() && (
          <StatsPanel engagements={engagements} />
        )}

        {error && <div className="banner-error">{error}</div>}

        {query.trim() ? (
          <GlobalSearchResults engagements={filtered} query={query} onOpen={onOpen} />
        ) : loading ? (
          <div className="empty-state">Loading engagements…</div>
        ) : engagements.length === 0 ? (
          <div className="empty-state">
            <h3>No engagements yet</h3>
            <p>
              Import a .json engagement file, or drop one into
              <code className="mono"> /data/engagements</code> and refresh.
            </p>
          </div>
        ) : (
          <>
            <div className="engagements-label">All Engagements</div>
            <div className="engagement-grid">
              {filtered.map((eng) => (
                <EngagementCard key={eng.id} engagement={eng} onClick={() => onOpen(eng.id)} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
