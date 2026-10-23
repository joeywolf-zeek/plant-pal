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
  const valid = plants.filter(
    (p) => p && typeof p.id === "string" && typeof p.nextDue === "string" && Number(p.baseInterval) > 0
  );
  if (!valid.length) throw new Error("No valid plants found in that file.");
  return valid;
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
