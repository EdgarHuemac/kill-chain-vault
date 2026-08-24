import { useMemo } from "react";
import { PHASES } from "../killchain.js";
import "./StatsPanel.css";

const TYPE_COLORS = {
  CTF: "#5aa9ff",
  PENTEST: "#ff9f43",
  CYBERATTACK: "#ff5c5c",
  RESEARCH: "#c084fc",
};

function computeStats(engagements) {
  const totalEvents = engagements.reduce((s, e) => s + (e.events?.length || 0), 0);
  const totalCommands = engagements.reduce(
    (s, e) => s + (e.events?.filter((ev) => ev.command).length || 0), 0
  );

  const phaseCounts = Object.fromEntries(PHASES.map((p) => [p.key, 0]));
  engagements.forEach((eng) => {
    (eng.events || []).forEach((ev) => {
      if (ev.phase && phaseCounts.hasOwnProperty(ev.phase)) phaseCounts[ev.phase]++;
    });
  });

  const maxPhase = Math.max(...Object.values(phaseCounts), 1);
  const phasesCovered = Object.values(phaseCounts).filter((c) => c > 0).length;

  const typeCounts = {};
  engagements.forEach((e) => {
    const t = e.type || "OTHER";
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });

  const objectivesReached = engagements.reduce(
    (s, e) => s + (e.events?.filter((ev) => ev.phase === "Actions on Objectives").length || 0), 0
  );

  return { total: engagements.length, totalEvents, totalCommands, phaseCounts, maxPhase, phasesCovered, typeCounts, objectivesReached };
}

export default function StatsPanel({ engagements }) {
  const stats = useMemo(() => computeStats(engagements), [engagements]);

  return (
    <div className="stats-panel">
      {/* Top row: key metrics */}
      <div className="stats-metrics">
        <div className="stat-metric">
          <span className="stat-metric-num">{stats.total}</span>
          <span className="stat-metric-label">Engagements</span>
          <div className="stat-type-pills">
            {Object.entries(stats.typeCounts).map(([type, count]) => (
              <span key={type} className="stat-type-pill" style={{ "--tc": TYPE_COLORS[type] || "#7a7a7a" }}>
                {type} {count}
              </span>
            ))}
          </div>
        </div>
        <div className="stat-metric">
          <span className="stat-metric-num">{stats.totalEvents}</span>
          <span className="stat-metric-label">Events logged</span>
        </div>
        <div className="stat-metric">
          <span className="stat-metric-num">{stats.totalCommands}</span>
          <span className="stat-metric-label">Commands in arsenal</span>
        </div>
        <div className="stat-metric">
          <span className="stat-metric-num">{stats.phasesCovered}<span className="stat-metric-of">/7</span></span>
          <span className="stat-metric-label">Phases covered</span>
        </div>
        <div className="stat-metric">
          <span className="stat-metric-num">{stats.objectivesReached}</span>
          <span className="stat-metric-label">Objectives reached</span>
        </div>
      </div>

      {/* Kill chain mastery grid */}
      <div className="kc-mastery">
        <div className="kc-mastery-label">Kill Chain Mastery</div>
        <div className="kc-phases">
          {PHASES.map((phase) => {
            const count = stats.phaseCounts[phase.key] || 0;
            const ratio = count / stats.maxPhase;
            const Icon = phase.icon;
            return (
              <div key={phase.key} className="kc-phase-item" title={`${phase.key}: ${count} events`}>
                <div
                  className="kc-phase-icon"
                  style={{
                    "--hue": phase.hue,
                    "--ratio": ratio,
                    opacity: count === 0 ? 0.18 : 0.3 + ratio * 0.7,
                  }}
                >
                  <Icon />
                  {count > 0 && <span className="kc-phase-count">{count}</span>}
                </div>
                <span className="kc-phase-name">{phase.short}</span>
                {count === 0 && <span className="kc-phase-zero">—</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
