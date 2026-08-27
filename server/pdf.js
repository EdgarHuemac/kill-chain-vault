import PDFDocument from "pdfkit";
import dagre from "@dagrejs/dagre";

// ── Page geometry ───────────────────────────────────────────────────────────
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M      = 52;          // horizontal margin
const CW     = PAGE_W - M * 2;

// ── Kill chain phase map ────────────────────────────────────────────────────
const PHASES = {
  "Reconnaissance":        { short: "RECON",    color: "#5aa9ff" },
  "Weaponization":         { short: "WEAPON",   color: "#f5a623" },
  "Delivery":              { short: "DELIVERY", color: "#c084fc" },
  "Exploitation":          { short: "EXPLOIT",  color: "#ff5c5c" },
  "Installation":          { short: "INSTALL",  color: "#ff9f43" },
  "Command and Control":   { short: "C2",       color: "#37d6c7" },
  "Actions on Objectives": { short: "OBJ",      color: "#4ade80" },
};

function getPhase(key) {
  return PHASES[key] || { short: "N/A", color: "#999999" };
}

// Blend hex color toward white (for badge backgrounds)
function lightHex(hex, alpha = 0.13) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const base = 248;
  const mix = (c) => Math.round(c * alpha + base * (1 - alpha));
  return "#" + [mix(r), mix(g), mix(b)].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function sortedEvents(events) {
  return [...(events || [])].sort((a, b) => {
    if (a.datetime && b.datetime) return new Date(a.datetime) - new Date(b.datetime);
    if (a.datetime) return -1;
    if (b.datetime) return 1;
    return 0;
  });
}

// ── Main export ─────────────────────────────────────────────────────────────

export function generateEngagementPdf(engagement, res) {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    bufferPages: true,
    info: {
      Title:    engagement.title,
      Author:   "Kill Chain Vault",
      Subject:  `Engagement Report — ${engagement.type || "N/A"}`,
      Creator:  "Kill Chain Vault",
    },
  });

  doc.pipe(res);

  const events = sortedEvents(engagement.events);

  // Page 1: Cover
  drawCover(doc, engagement, events);

  if (events.length > 0) {
    // Page 2: Attack flow graph
    doc.addPage({ margins: { top: 72, bottom: 60, left: M, right: M } });
    drawGraphPage(doc, events);

    // Pages 3+: Event details
    doc.addPage({ margins: { top: 72, bottom: 60, left: M, right: M } });
    events.forEach((event, i) => {
      if (i > 0) ensureSpace(doc, 160);
      drawEvent(doc, event, i, events.length);
    });
  }

  // Running header on all content pages
  const range = doc.bufferedPageRange();
  const contentPages = range.count - 1;
  for (let i = 1; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    drawRunningHeader(doc, engagement.title, i, contentPages);
  }

  doc.flushPages();
  doc.end();
}

// ── Cover page ──────────────────────────────────────────────────────────────

function drawCover(doc, eng, events) {
  const HEADER_H = 185;

  doc.rect(0, 0, PAGE_W, HEADER_H).fill("#060606");
  doc.rect(M, HEADER_H - 5, 36, 3).fill("#1e1e1e");

  doc.font("Helvetica-Bold").fontSize(9).fillColor("#484848")
     .text("KILL CHAIN VAULT", M, 50, { characterSpacing: 3.5, lineBreak: false });
  doc.font("Helvetica").fontSize(8.5).fillColor("#282828")
     .text("ENGAGEMENT REPORT", M, 66, { characterSpacing: 2.5, lineBreak: false });
  doc.font("Helvetica").fontSize(8).fillColor("#282828")
     .text(new Date().toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" }),
           M, 50, { width: CW, align: "right", lineBreak: false });

  let y = HEADER_H + 44;

  // Type badge
  const typeStr = (eng.type || "N/A").toUpperCase();
  doc.font("Helvetica-Bold").fontSize(8.5);
  const tw = doc.widthOfString(typeStr, { characterSpacing: 1.2 }) + 24;
  doc.roundedRect(M, y, tw, 19, 3).fill("#efefef");
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#7a7a7a")
     .text(typeStr, M + 12, y + 6, { characterSpacing: 1.2, lineBreak: false });
  y += 37;

  // Title
  doc.font("Helvetica-Bold").fontSize(34).fillColor("#0d0d0d")
     .text(eng.title, M, y, { width: CW, lineGap: 2 });
  y = doc.y + 22;

  // Description
  if (eng.description) {
    doc.font("Helvetica").fontSize(13).fillColor("#424242")
       .text(eng.description, M, y, { width: CW, lineGap: 3 });
    y = doc.y + 22;
  }

  // Divider
  doc.rect(M, y, CW, 0.75).fill("#e0e0e0");
  y += 22;

  // Target + Tags — track doc.y to avoid overlap
  const metaStartY = y;
  let mx = M;
  if (eng.target) {
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#aaaaaa")
       .text("TARGET", mx, y, { characterSpacing: 1.8, lineBreak: false });
    doc.font("Helvetica").fontSize(11.5).fillColor("#1a1a1a")
       .text(String(eng.target), mx, y + 15, { width: 140, lineBreak: false });
    mx += 155;
  }
  if (eng.tags && eng.tags.length) {
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#aaaaaa")
       .text("TAGS", mx, y, { characterSpacing: 1.8, lineBreak: false });
    doc.font("Helvetica").fontSize(11).fillColor("#777777")
       .text(eng.tags.slice(0, 10).join("  ·  "), mx, y + 15, { width: CW - (mx - M) });
  }
  // Advance y by the taller of: content height or a fixed minimum
  y = Math.max(metaStartY + 56, doc.y + 20);

  // Stats row
  doc.rect(M, y, CW, 0.75).fill("#e0e0e0");
  y += 22;

  const phasesUsed = [...new Set(events.map((e) => e.phase).filter(Boolean))];
  const cmdCount   = events.filter((e) => e.command).length;
  const stats = [
    { label: "TOTAL EVENTS",    value: String(events.length) },
    { label: "COMMANDS",        value: String(cmdCount) },
    { label: "PHASES COVERED",  value: `${phasesUsed.length} / 7` },
  ];
  const sw = CW / stats.length;
  stats.forEach(({ label, value }, i) => {
    const sx = M + i * sw;
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#aaaaaa")
       .text(label, sx, y, { characterSpacing: 1.5, lineBreak: false });
    doc.font("Helvetica-Bold").fontSize(24).fillColor("#111111")
       .text(value, sx, y + 13, { lineBreak: false });
  });
  y += 64;

  // Kill chain coverage
  doc.rect(M, y, CW, 0.75).fill("#e0e0e0");
  y += 18;
  doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#aaaaaa")
     .text("KILL CHAIN COVERAGE", M, y, { characterSpacing: 1.5, lineBreak: false });
  y += 15;

  const phaseList = Object.entries(PHASES);
  const dotR  = 5.5;
  const itemW = CW / phaseList.length;
  phaseList.forEach(([key, info], i) => {
    const covered = phasesUsed.includes(key);
    const cx = M + i * itemW + itemW / 2;
    const cy = y + dotR;
    if (covered) {
      doc.circle(cx, cy, dotR).fill(info.color);
    } else {
      doc.circle(cx, cy, dotR).lineWidth(0.75).strokeColor("#d0d0d0").stroke();
    }
    doc.font("Helvetica-Bold").fontSize(6.5)
       .fillColor(covered ? "#555555" : "#cccccc")
       .text(info.short, M + i * itemW, cy + dotR + 5, {
         width: itemW, align: "center", characterSpacing: 0.3, lineBreak: false,
       });
  });

  // Footer
  const fy = PAGE_H - 42;
  doc.rect(M, fy - 10, CW, 0.5).fill("#e0e0e0");
  doc.font("Helvetica").fontSize(7.5).fillColor("#b0b0b0")
     .text("Generated by Kill Chain Vault  ·  For authorized use only", M, fy, {
       width: CW, align: "center", lineBreak: false,
     });
}

// ── Graph page ──────────────────────────────────────────────────────────────

function drawGraphPage(doc, events) {
  // Section header
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#aaaaaa")
     .text("ATTACK FLOW", M, doc.y, { characterSpacing: 2.5, lineBreak: false });
  doc.moveDown(0.4);
  doc.rect(M, doc.y, CW, 0.5).fill("#e8e8e8");
  doc.moveDown(1.0);

  const graphY = doc.y;
  const graphH = drawGraph(doc, events, graphY);
  doc.y = graphY + graphH + 20;
}

// ── Snake graph layout + drawing ─────────────────────────────────────────────

function topoSort(events) {
  const ids = new Set(events.map((e) => e.id));
  const inDeg = new Map(events.map((e) => [e.id, 0]));
  const adj   = new Map(events.map((e) => [e.id, []]));

  events.forEach((e) => {
    (e.connections || []).forEach((tid) => {
      if (ids.has(tid)) {
        inDeg.set(tid, inDeg.get(tid) + 1);
        adj.get(e.id).push(tid);
      }
    });
  });

  const queue  = events.filter((e) => inDeg.get(e.id) === 0).map((e) => e.id);
  const result = [];
  while (queue.length) {
    const id = queue.shift();
    const ev = events.find((e) => e.id === id);
    if (ev) result.push(ev);
    (adj.get(id) || []).forEach((tid) => {
      inDeg.set(tid, inDeg.get(tid) - 1);
      if (inDeg.get(tid) === 0) queue.push(tid);
    });
  }
  events.forEach((e) => { if (!result.find((r) => r.id === e.id)) result.push(e); });
  return result;
}

function drawGraph(doc, events, startY) {
  if (!events || events.length === 0) return 0;

  const ordered  = topoSort(events);
  const PER_ROW  = 4;
  const NW       = 108;   // node width
  const NH       = 54;    // node height
  const GX       = 13;    // horizontal gap
  const GY       = 32;    // vertical gap between rows

  const indexMap = new Map(ordered.map((e, i) => [e.id, i]));
  const eventMap = new Map(events.map((e) => [e.id, e]));

  function pos(idx) {
    const row       = Math.floor(idx / PER_ROW);
    const col       = idx % PER_ROW;
    const isEven    = row % 2 === 0;
    const x = isEven
      ? M + col * (NW + GX)
      : M + (PER_ROW - 1 - col) * (NW + GX);
    const y = startY + row * (NH + GY);
    return { x, y, row, isEven };
  }

  // ── Draw edges (behind nodes) ──
  events.forEach((event) => {
    const si = indexMap.get(event.id);
    if (si === undefined) return;
    const sp = pos(si);

    (event.connections || []).forEach((tid) => {
      const ti = indexMap.get(tid);
      if (ti === undefined) return;
      const tp  = pos(ti);
      const col = getPhase(eventMap.get(tid)?.phase).color;

      const samRow    = sp.row === tp.row;
      const nextRow   = tp.row === sp.row + 1;
      const adjacent  = ti === si + 1;

      if (samRow && adjacent) {
        // Horizontal arrow within row
        if (sp.isEven) {
          arrowLine(doc, sp.x + NW, sp.y + NH / 2, tp.x, tp.y + NH / 2, col);
        } else {
          arrowLine(doc, sp.x, sp.y + NH / 2, tp.x + NW, tp.y + NH / 2, col);
        }
      } else if (nextRow && adjacent) {
        // Row transition – both share same x column in snake layout
        const cx = sp.x + NW / 2;
        const cy = tp.y + NH / 2;
        doc.moveTo(cx, sp.y + NH).lineTo(cx, tp.y)
           .lineWidth(1).strokeColor(col).stroke();
        arrowHead(doc, cx, tp.y, Math.PI / 2, col);
      } else {
        // Branch or skip: dashed straight line
        doc.moveTo(sp.x + NW / 2, sp.y + NH / 2)
           .lineTo(tp.x + NW / 2, tp.y + NH / 2)
           .lineWidth(0.8).dash(3, { space: 3 }).strokeColor(col).stroke();
        doc.undash();
        arrowHead(doc, tp.x + NW / 2, tp.y + NH / 2,
          Math.atan2(tp.y - sp.y, tp.x - sp.x), col);
      }
    });
  });

  // ── Draw nodes on top ──
  ordered.forEach((event, i) => {
    const p  = pos(i);
    const ph = getPhase(event.phase);

    // Background
    doc.roundedRect(p.x, p.y, NW, NH, 5).fill("#fafafa");
    // Border
    doc.roundedRect(p.x, p.y, NW, NH, 5).lineWidth(0.5).strokeColor("#dedede").stroke();
    // Phase color bar (left)
    doc.rect(p.x, p.y + 5, 3, NH - 10).fill(ph.color);

    // Index
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#c8c8c8")
       .text(String(i + 1).padStart(2, "0"), p.x + 8, p.y + 7, { lineBreak: false });

    // Phase dot (top-right)
    doc.circle(p.x + NW - 9, p.y + 11, 4).fill(ph.color);

    // Title
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#1a1a1a")
       .text(event.title, p.x + 8, p.y + 20, {
         width: NW - 18, height: 15, lineBreak: false, ellipsis: true,
       });

    // Phase label
    doc.font("Helvetica").fontSize(6.5).fillColor("#b0b0b0")
       .text(ph.short, p.x + 8, p.y + NH - 13, { width: NW - 16, lineBreak: false });
  });

  const totalRows = Math.ceil(ordered.length / PER_ROW);
  return totalRows * (NH + GY) - GY;
}

function arrowLine(doc, x1, y1, x2, y2, color) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  doc.moveTo(x1, y1).lineTo(x2, y2).lineWidth(1).strokeColor(color).stroke();
  arrowHead(doc, x2, y2, angle, color);
}

function arrowHead(doc, tipX, tipY, angle, color, size = 5) {
  const a1 = angle - Math.PI / 6;
  const a2 = angle + Math.PI / 6;
  doc.moveTo(tipX, tipY)
     .lineTo(tipX - size * Math.cos(a1), tipY - size * Math.sin(a1))
     .lineTo(tipX - size * Math.cos(a2), tipY - size * Math.sin(a2))
     .closePath().fill(color);
}

// ── Running header for content pages ────────────────────────────────────────

function drawRunningHeader(doc, title, pageNum, totalContentPages) {
  doc.font("Helvetica-Bold").fontSize(7).fillColor("#c0c0c0")
     .text("KILL CHAIN VAULT", M, 18, { characterSpacing: 1.5, lineBreak: false });
  doc.font("Helvetica").fontSize(7).fillColor("#c0c0c0")
     .text(title.toUpperCase(), M, 18, { width: CW, align: "center", lineBreak: false });
  doc.font("Helvetica").fontSize(7).fillColor("#c0c0c0")
     .text(`${pageNum} / ${totalContentPages}`, M, 18, { width: CW, align: "right", lineBreak: false });
  doc.rect(M, 32, CW, 0.5).fill("#ebebeb");
}

// ── Page space check ─────────────────────────────────────────────────────────

function ensureSpace(doc, needed) {
  if (PAGE_H - doc.page.margins.bottom - doc.y < needed) {
    doc.addPage({ margins: { top: 72, bottom: 60, left: M, right: M } });
  }
}

// ── Single event block ───────────────────────────────────────────────────────

function drawEvent(doc, event, index, total) {
  const ph     = getPhase(event.phase);
  const startY = doc.y;
  const barX   = M - 13;

  // Index number
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#c0c0c0")
     .text(String(index + 1).padStart(2, "0"), M, doc.y, { lineBreak: false });

  // Phase badge (right-aligned)
  doc.font("Helvetica-Bold").fontSize(8);
  const bw = doc.widthOfString(ph.short, { characterSpacing: 1.1 }) + 20;
  const bh = 15;
  const bx = M + CW - bw;
  const by = doc.y;
  doc.roundedRect(bx, by, bw, bh, 3).fill(lightHex(ph.color, 0.14));
  doc.font("Helvetica-Bold").fontSize(8).fillColor(ph.color)
     .text(ph.short, bx + 10, by + 4.5, { characterSpacing: 1.1, lineBreak: false });

  doc.moveDown(0.3);

  // Title
  doc.font("Helvetica-Bold").fontSize(15.5).fillColor("#111111")
     .text(event.title, M, doc.y, { width: CW - bw - 12 });

  // Datetime
  if (event.datetime) {
    const dt = new Date(event.datetime);
    const dStr = isNaN(dt.getTime()) ? event.datetime
      : dt.toLocaleString("en-US", { year:"numeric", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" });
    doc.moveDown(0.2);
    doc.font("Helvetica").fontSize(8.5).fillColor("#b0b0b0")
       .text(dStr, M, doc.y, { lineBreak: false });
  }

  doc.moveDown(0.7);

  // Description
  if (event.description) {
    doc.font("Helvetica").fontSize(11.5).fillColor("#333333")
       .text(event.description, M, doc.y, { width: CW, lineGap: 2.5 });
    doc.moveDown(0.7);
  }

  // Command block
  if (event.command) {
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#aaaaaa")
       .text("COMMAND", M, doc.y, { characterSpacing: 1.5, lineBreak: false });
    doc.moveDown(0.45);

    const codePad = 11;
    const codeFS  = 9.5;
    const codeW   = CW - codePad * 2 - 3;
    doc.font("Courier").fontSize(codeFS);
    const codeH  = doc.heightOfString(event.command, { width: codeW, lineGap: 2 });
    const blockH = codeH + codePad * 2;
    const blockY = doc.y;

    doc.rect(M, blockY, CW, blockH).fill("#101010");
    doc.rect(M, blockY, 3, blockH).fill(ph.color);
    doc.font("Courier").fontSize(codeFS).fillColor("#d4d4d4")
       .text(event.command, M + codePad + 3, blockY + codePad, { width: codeW, lineGap: 2 });

    doc.y = blockY + blockH + 2;
    doc.moveDown(0.7);
  }

  // Comments
  if (event.comments) {
    doc.font("Helvetica-Oblique").fontSize(10.5).fillColor("#8a8a8a")
       .text(event.comments, M, doc.y, { width: CW, lineGap: 2.5 });
    doc.moveDown(0.6);
  }

  // Phase color bar on the left (retroactive, full block height)
  doc.rect(barX, startY, 3, doc.y - startY).fill(ph.color);

  // Divider between events
  if (index < total - 1) {
    doc.moveDown(0.55);
    doc.rect(M, doc.y, CW, 0.5).fill("#eeeeee");
    doc.moveDown(1.1);
  }
}
