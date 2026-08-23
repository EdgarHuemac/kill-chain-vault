import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data", "engagements");
const CLIENT_DIST = path.join(__dirname, "..", "client", "dist");

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

await fs.mkdir(DATA_DIR, { recursive: true });

// ---- helpers -------------------------------------------------------------

function slugify(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

async function readAllEngagements() {
  const files = await fs.readdir(DATA_DIR);
  const jsonFiles = files.filter((f) => f.toLowerCase().endsWith(".json"));
  const engagements = [];
  for (const file of jsonFiles) {
    try {
      const raw = await fs.readFile(path.join(DATA_DIR, file), "utf-8");
      const parsed = JSON.parse(raw);
      if (!parsed.id) parsed.id = slugify(path.basename(file, ".json"));
      parsed.__file = file;
      engagements.push(parsed);
    } catch (err) {
      console.warn(`Skipping ${file}: ${err.message}`);
    }
  }
  // sort newest-ish first by title as fallback
  engagements.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  return engagements;
}

async function writeEngagement(engagement) {
  if (!engagement.id) engagement.id = uuidv4();
  const filename = `${slugify(engagement.title || engagement.id)}-${engagement.id.slice(0, 8)}.json`;
  const filePath = path.join(DATA_DIR, filename);
  const toSave = { ...engagement };
  delete toSave.__file;
  await fs.writeFile(filePath, JSON.stringify(toSave, null, 2), "utf-8");
  return { ...toSave, __file: filename };
}

// ---- routes ---------------------------------------------------------------

app.get("/api/engagements", async (req, res) => {
  try {
    const engagements = await readAllEngagements();
    res.json(engagements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/engagements/:id", async (req, res) => {
  try {
    const engagements = await readAllEngagements();
    const found = engagements.find((e) => e.id === req.params.id);
    if (!found) return res.status(404).json({ error: "Engagement not found" });
    res.json(found);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/engagements", async (req, res) => {
  try {
    const engagement = req.body;
    if (!engagement || typeof engagement !== "object") {
      return res.status(400).json({ error: "Invalid engagement payload" });
    }
    if (!engagement.title) {
      return res.status(400).json({ error: "Engagement must have a title" });
    }
    if (!engagement.id) engagement.id = uuidv4();
    const saved = await writeEngagement(engagement);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/engagements/:id", async (req, res) => {
  try {
    const engagements = await readAllEngagements();
    const found = engagements.find((e) => e.id === req.params.id);
    if (!found) return res.status(404).json({ error: "Engagement not found" });
    await fs.unlink(path.join(DATA_DIR, found.__file));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- serve built client in production -------------------------------------

app.use(express.static(CLIENT_DIST));
app.get("*", async (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  try {
    res.sendFile(path.join(CLIENT_DIST, "index.html"));
  } catch {
    res.status(404).send("Client not built yet. Run `npm run build` in /client.");
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Kill Chain Vault API running on http://localhost:${PORT}`);
  console.log(`Watching engagements in: ${DATA_DIR}`);
});
