const BASE = "/api";

export async function fetchEngagements() {
  const res = await fetch(`${BASE}/engagements`);
  if (!res.ok) throw new Error("Failed to load engagements");
  return res.json();
}

export async function fetchEngagement(id) {
  const res = await fetch(`${BASE}/engagements/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error("Engagement not found");
  return res.json();
}

export async function createEngagement(engagement) {
  const res = await fetch(`${BASE}/engagements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(engagement),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to import engagement");
  }
  return res.json();
}

export async function deleteEngagement(id) {
  const res = await fetch(`${BASE}/engagements/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete engagement");
  return res.json();
}
