// Returns true if the event matches the query across all searchable fields.
export function eventMatches(event, query) {
  if (!query || !query.trim()) return true;
  const q = query.trim().toLowerCase();
  const haystacks = [
    event.title,
    event.description,
    event.phase,
    event.command,
    event.comments,
  ];
  return haystacks.some((field) => (field || "").toLowerCase().includes(q));
}

export function engagementMatches(engagement, query) {
  if (!query || !query.trim()) return true;
  const q = query.trim().toLowerCase();
  if ((engagement.title || "").toLowerCase().includes(q)) return true;
  if ((engagement.description || "").toLowerCase().includes(q)) return true;
  if ((engagement.type || "").toLowerCase().includes(q)) return true;
  return (engagement.events || []).some((ev) => eventMatches(ev, q));
}

// Splits `text` into an array of { text, match } chunks for highlighting.
export function splitHighlight(text, query) {
  if (!text) return [{ text: "", match: false }];
  if (!query || !query.trim()) return [{ text, match: false }];
  const q = query.trim();
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${escaped})`, "ig");
  const parts = text.split(re);
  return parts
    .filter((p) => p !== "")
    .map((p) => ({ text: p, match: p.toLowerCase() === q.toLowerCase() }));
}
