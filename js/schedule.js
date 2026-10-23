// Care lookup, interval math, and date helpers.
import { PLANTS, DEFAULT_CARE } from "./plants-data.js";

// ── Lookup ───────────────────────────────────────────────────────────

const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

/**
 * Find care info for a plant. Order: species → genus → family → default.
 * @param {object} q  { scientific?: "Genus species", genus?: string, family?: string, text?: string }
 *                    `text` is whatever the user typed (common or scientific name).
 * @returns {object} a PLANTS entry or DEFAULT_CARE
 */
export function findCare(q) {
  const sci = norm(q.scientific);
  const genus = norm(q.genus) || sci.split(" ")[0];
  const family = norm(q.family);
  const text = norm(q.text);

  const byName = (rank, name) =>
    name && PLANTS.find((p) => p.rank === rank &&
      (norm(p.name) === name || (p.synonyms || []).some((s) => norm(s) === name)));

  // 1. Species: exact scientific name (or synonym)
  let hit = byName("species", sci);
  if (hit) return hit;

  // Typed text: exact common name or scientific name, any rank (species first).
  // Skipped when we have a scientific name — common names are ambiguous ("money tree").
  if (text && !sci) {
    hit = PLANTS.find((p) => norm(p.name) === text || (p.synonyms || []).some((s) => norm(s) === text))
      || PLANTS.find((p) => p.common.some((c) => norm(c) === text));
    if (hit) return hit;
  }

  // 2. Genus
  hit = byName("genus", genus) || byName("genus", text.split(" ")[0]);
  if (hit) return hit;
  // A species entry whose genus matches is a fine stand-in (e.g. "Ficus lyrata" for an unknown Ficus)
  if (genus) {
    hit = PLANTS.find((p) => norm(p.name).split(" ")[0] === genus);
    if (hit) return hit;
  }

  // 3. Family
  hit = byName("family", family);
  if (hit) return hit;

  // Last try for typed text: partial common-name match ("my pothos" → pothos).
  // Longest match wins, so "chinese money plant" beats "money plant".
  if (text && !sci) {
    let best = null, bestLen = 3;
    for (const p of PLANTS) for (const c of p.common) {
      const n = norm(c);
      if (n.length > bestLen && text.includes(n)) { best = p; bestLen = n.length; }
    }
    if (best) return best;
  }

  // 4. Default
  return DEFAULT_CARE;
}

// ── Interval math ────────────────────────────────────────────────────

export const LIGHT_FACTOR = { low: 1.25, medium: 1, bright: 0.8 };
export const POT_FACTOR = { small: 0.8, medium: 1, large: 1.2 };
export const WINTER_FACTOR = 1.4;

export function isWinter(date = new Date(), hemisphere = "north") {
  const m = date.getMonth(); // 0 = Jan
  return hemisphere === "south" ? m >= 4 && m <= 7 : m >= 10 || m <= 1;
}

export function seasonFactor(date = new Date(), hemisphere = "north") {
  return isWinter(date, hemisphere) ? WINTER_FACTOR : 1;
}

/**
 * Suggested interval plus a human-readable breakdown for the UI.
 * Returns { days, baseYearRound, steps: [{label, pct}] }
 *   baseYearRound = interval without the winter adjustment (stored on the plant,
 *   so the season can be re-applied each time you water).
 */
export function suggestInterval(care, light, pot, date = new Date(), hemisphere = "north") {
  const steps = [];
  let yearRound = care.days;
  const lf = LIGHT_FACTOR[light] ?? 1;
  const pf = POT_FACTOR[pot] ?? 1;
  if (lf !== 1) steps.push({ label: `${light} light`, pct: Math.round((lf - 1) * 100) });
  if (pf !== 1) steps.push({ label: `${pot} pot`, pct: Math.round((pf - 1) * 100) });
  yearRound *= lf * pf;
  const sf = seasonFactor(date, hemisphere);
  if (sf !== 1) steps.push({ label: "winter", pct: Math.round((sf - 1) * 100) });
  return { days: Math.max(1, Math.round(yearRound * sf)), baseYearRound: yearRound, steps };
}

/** Interval to use right now for a saved plant (its year-round base × current season). */
export function currentInterval(plant, date = new Date(), hemisphere = "north") {
  return Math.max(1, Math.round(plant.baseInterval * seasonFactor(date, hemisphere)));
}

// ── Dates (stored as local "YYYY-MM-DD" strings) ─────────────────────

export function toISODate(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function parseISODate(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export const today = () => toISODate(new Date());

export function addDays(iso, n) {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

/** Whole days from a to b (b − a). Uses UTC so daylight-saving shifts don't cause off-by-one. */
export function daysBetween(a, b) {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

/** Status badge for a due date. */
export function dueStatus(nextDue, now = today()) {
  const n = daysBetween(now, nextDue);
  if (n < 0) return { kind: "late", label: n === -1 ? "1 day late" : `${-n} days late`, n };
  if (n === 0) return { kind: "today", label: "Today", n };
  if (n === 1) return { kind: "soon", label: "Tomorrow", n };
  return { kind: "later", label: `In ${n} days`, n };
}

export function formatDate(iso) {
  return parseISODate(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
