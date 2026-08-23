import { Eye, Wrench, Send, Bomb, Package, Satellite, Flag, HelpCircle } from "lucide-react";

// Lockheed Martin Cyber Kill Chain, in canonical order.
export const PHASES = [
  {
    key: "Reconnaissance",
    short: "RECON",
    icon: Eye,
    hue: "#5aa9ff",
  },
  {
    key: "Weaponization",
    short: "WEAPON",
    icon: Wrench,
    hue: "#f5a623",
  },
  {
    key: "Delivery",
    short: "DELIVERY",
    icon: Send,
    hue: "#c084fc",
  },
  {
    key: "Exploitation",
    short: "EXPLOIT",
    icon: Bomb,
    hue: "#ff5c5c",
  },
  {
    key: "Installation",
    short: "INSTALL",
    icon: Package,
    hue: "#ff9f43",
  },
  {
    key: "Command and Control",
    short: "C2",
    icon: Satellite,
    hue: "#37d6c7",
  },
  {
    key: "Actions on Objectives",
    short: "OBJECTIVE",
    icon: Flag,
    hue: "#4ade80",
  },
];

export const PHASE_MAP = Object.fromEntries(PHASES.map((p) => [p.key, p]));

export function getPhase(key) {
  return (
    PHASE_MAP[key] || {
      key: key || "Unknown",
      short: "N/A",
      icon: HelpCircle,
      hue: "#7a7a7a",
    }
  );
}

export const ENGAGEMENT_TYPES = ["CTF", "PENTEST", "CYBERATTACK", "RESEARCH"];
