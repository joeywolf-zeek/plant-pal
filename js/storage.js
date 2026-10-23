// localStorage persistence + JSON backup export/import.
//
// Plant shape:
// {
//   id, name, scientific, nickname, careName,
//   light: "low"|"medium"|"bright", pot: "small"|"medium"|"large", location: "indoors"|"outdoors",
//   tox, tip,
//   baseInterval,   // year-round interval in days (may be fractional; season applied on top)
//   lastWatered,    // "YYYY-MM-DD"
//   nextDue,        // "YYYY-MM-DD"
//   dampCount,      // consecutive "still damp" checks since last watering
//   photo,          // small JPEG data URL or null
//   addedAt
// }

const KEY = "plantApp.v1";

export function loadPlants() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(data?.plants) ? data.plants : [];
  } catch {
    return [];
  }
}

/** Returns true on success, false if storage is full/unavailable. */
export function savePlants(plants) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, plants }));
    return true;
  } catch (err) {
    console.error("Save failed", err);
    return false;
  }
}

export function exportBackup(plants, appName = "plants") {
  const blob = new Blob(
    [JSON.stringify({ app: appName, version: 1, exportedAt: new Date().toISOString(), plants }, null, 2)],
    { type: "application/json" }
  );
  const slug = appName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  downloadBlob(blob, `${slug}-backup-${new Date().toISOString().slice(0, 10)}.json`);
}

/**
 * Parse a backup file. Returns the list of plants it contains (validated).
 * Throws an Error with a friendly message if the file isn't a backup.
 */
export async function readBackup(file) {
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch {
    throw new Error("That file isn't valid JSON.");
  }
  const plants = Array.isArray(data) ? data : data?.plants;
  if (!Array.isArray(plants)) throw new Error("No plants found in that file.");
  const valid = plants.map(normalizePlant).filter(Boolean);
  if (!valid.length) throw new Error("No valid plants found in that file.");
  return valid;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const pick = (v, allowed, fallback) => (allowed.includes(v) ? v : fallback);
const str = (v, max = 200) => (typeof v === "string" ? v.slice(0, max) : "");

/** Clean up one imported plant so a hand-edited or old backup can't break the app. Returns null if unusable. */
function normalizePlant(p) {
  if (!p || typeof p !== "object") return null;
  const base = Number(p.baseInterval);
  if (typeof p.id !== "string" || !p.id || !DATE.test(p.nextDue) || !(base > 0 && base <= 365)) return null;
  const name = str(p.name) || str(p.nickname) || "Plant";
  return {
    id: p.id.slice(0, 100),
    name,
    scientific: str(p.scientific),
    nickname: str(p.nickname, 40),
    careName: str(p.careName),
    light: pick(p.light, ["low", "medium", "bright"], "medium"),
    pot: pick(p.pot, ["small", "medium", "large"], "medium"),
    location: pick(p.location, ["indoors", "outdoors"], "indoors"),
    tox: pick(p.tox, ["toxic", "mild", "safe"], null),
    tip: str(p.tip, 500),
    baseInterval: base,
    lastWatered: DATE.test(p.lastWatered) ? p.lastWatered : null,
    nextDue: p.nextDue,
    dampCount: Number.isInteger(p.dampCount) && p.dampCount >= 0 ? p.dampCount : 0,
    // Only accept small embedded JPEG/PNG thumbnails.
    photo: typeof p.photo === "string" && /^data:image\/(jpeg|png);base64,/.test(p.photo) && p.photo.length < 200000 ? p.photo : null,
    addedAt: str(p.addedAt, 40),
  };
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
