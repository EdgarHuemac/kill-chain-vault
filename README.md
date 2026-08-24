# Kill Chain Vault

A local, black-on-black web app for documenting and visualizing CTFs, pentests, and
cyberattack timelines as Cyber Kill Chain graphs. Everything is stored as plain JSON
files on disk — no database, no cloud, nothing to configure.

```
Dashboard (list + global search + import)
        │
        ▼
Engagement view
  ├─ Graph: events as icon-boxes, connected in chronological order
  ├─ In-engagement search (highlights matches in the graph + log)
  └─ Timeline log: plain-text accordion, one row per event
```

## 1. Install

Requires Node.js 18+.

```bash
npm run install:all
```

## 2. Run it

```bash
npm run dev
```

This starts the API server on `http://localhost:4000` and the Vite dev server on
`http://localhost:5173` (open that one in your browser). Hot reload is on.

For a single-process production-style run instead:

```bash
npm run build   # builds the client
npm start        # builds + serves everything from http://localhost:4000
```

## 3. Adding engagements

Two ways, both write to the same place (`/data/engagements/*.json`):

- **From the UI** — click **Import engagement** on the dashboard and pick a `.json` file.
- **Drop it on disk** — copy a `.json` file straight into `data/engagements/`. The app
  reads that folder fresh every time the dashboard loads, so just hit refresh (no
  server restart needed).

A sample engagement (`sample-htb-lame.json`) is included so you can see the format
in action immediately.

## 4. The JSON schema

Each file in `data/engagements/` is **one engagement**:

```jsonc
{
  "id": "optional-stable-id",        // auto-generated from filename if omitted
  "title": "HTB: Lame",              // required
  "type": "CTF",                     // "CTF" | "PENTEST" | "CYBERATTACK" | "RESEARCH"
  "description": "One-line summary of the engagement.",
  "target": "10.10.10.3",            // optional, free text
  "tags": ["linux", "samba", "easy"],// optional
  "events": [
    {
      "id": "e1",                    // required, unique within this engagement
      "title": "Nmap full port scan",
      "phase": "Reconnaissance",     // one of the 7 Kill Chain phases below
      "command": "nmap -p- -sC -sV 10.10.10.3",
      "description": "What this step does and why.",
      "comments": "Optional notes — findings, gotchas, results.",
      "datetime": "2026-01-05T09:02:00Z",  // optional, ISO 8601
      "connections": ["e2"]          // ids of the event(s) this leads into
    }
  ]
}
```

`connections` is what draws the graph: it's a directed edge from this event to the
next one(s) in the chain. Most timelines are linear (each event points at exactly one
successor), but you can branch or merge — the layout engine will lane events out
automatically so nothing overlaps.

### Kill Chain phases → icons

| Phase                     | Icon      |
|---------------------------|-----------|
| Reconnaissance            | eye       |
| Weaponization             | wrench    |
| Delivery                  | send      |
| Exploitation              | bomb      |
| Installation              | package   |
| Command and Control       | satellite |
| Actions on Objectives     | flag      |

## 5. Turning a CTF writeup/video into a JSON file

This is the whole point of the tool: paste a writeup, transcript, or your own notes
into your AI assistant of choice and ask it to produce a JSON file matching the schema
above (one event per meaningful command/step, phases assigned per the table). Drop the
result into `data/engagements/` and refresh the dashboard.

## 6. Project layout

```
killchain-vault/
├── data/engagements/   ← the "database" — one .json file per engagement
├── server/             ← Express API (reads/writes data/engagements)
└── client/             ← React + Vite frontend (dashboard, graph, timeline)
```
