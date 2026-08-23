import { Layers, ArrowUpRight } from "lucide-react";
import { getPhase } from "../killchain.js";

const TYPE_LABEL = {
  CTF: "CTF",
  PENTEST: "Pentest",
  CYBERATTACK: "Cyberattack",
  RESEARCH: "Research",
};

export default function EngagementCard({ engagement, onClick }) {
  const events = engagement.events || [];
  const phasesUsed = [...new Set(events.map((e) => e.phase))];

  return (
    <button className="eng-card" onClick={onClick}>
      <div className="eng-card-top">
        <span className="badge">{TYPE_LABEL[engagement.type] || engagement.type || "N/A"}</span>
        <ArrowUpRight className="eng-card-arrow" />
      </div>
      <h3 className="eng-card-title">{engagement.title}</h3>
      {engagement.description && (
        <p className="eng-card-desc">{engagement.description}</p>
      )}
      <div className="eng-card-footer">
        <span className="eng-card-meta">
          <Layers /> {events.length} event{events.length === 1 ? "" : "s"}
        </span>
        <div className="eng-card-phases">
          {phasesUsed.slice(0, 6).map((p) => {
            const phase = getPhase(p);
            const Icon = phase.icon;
            return (
              <span key={p} className="phase-dot" style={{ "--hue": phase.hue }} title={phase.key}>
                <Icon />
              </span>
            );
          })}
        </div>
      </div>
    </button>
  );
}
