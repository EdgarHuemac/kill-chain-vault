# Kill Chain Vault

A web app for documenting and visualizing CTFs, pentests, and cyberattack timelines as Cyber Kill Chain graphs.
The sole purpose of this project is to help me document & organize CTFs for some cybersecurit certs. It might also be useful for real pentests, but who knows...


https://github.com/user-attachments/assets/20a6eeaa-6043-4205-a06a-51ebe53ccf5e

```
Dashboard (list + global search + import)
        │
        ▼
Engagement view
  ├─ Graph: events as icon-boxes, connected in chronological order
  ├─ In-engagement search (highlights matches in the graph + log)
  ├─ Timeline log: plain-text accordion, one row per event
  └─ Download PDF report option
```


it requires Node.js 18+ (it was tested using v22 tho)

```bash
npm run install:all
npm run dev
```

This starts the API server on `http://localhost:4000` and the Vite dev server on
`http://localhost:5173` (open that one in your browser). Hot reload is on.


## Adding engagements

Two ways, both write to the same place (`/data/engagements/*.json`):

- **From the UI**: click **Import engagement** on the dashboard and pick a `.json` file.
- **Drop it on disk**: copy a `.json` file straight into `data/engagements/`. The app
  reads that folder fresh every time the dashboard loads, so just hit refresh (no
  server restart needed).

A couple samples of engagements (`sample-htb-lame.json`) are included so you can see the format
in action immediately.

## The JSON schema

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


## Turning a CTF writeup/video into a JSON file

This is the whole point of the tool: paste a report, notes, writeup, transcript, or whatever you used to document a cyberattack/engagement/pentest into an AI assistant of your choice and ask it to produce a JSON file matching the schema
above Drop the result into `data/engagements/` and refresh the dashboard.

## Project layout

```
killchain-vault/
├── data/engagements/   ← the "database" — one .json file per engagement
├── server/             ← Express API (reads/writes data/engagements)
└── client/             ← React + Vite frontend (a very vibe-coded frontend he he)
```
