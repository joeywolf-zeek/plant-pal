// Main UI: renders the plant list and runs the add-plant sheet.
import { PLANTS } from "./plants-data.js";
import {
  findCare, suggestInterval, currentInterval, seasonFactor,
  today, addDays, dueStatus, formatDate,
} from "./schedule.js";
import { loadPlants, savePlants, exportBackup, readBackup, downloadBlob } from "./storage.js";
import { processPhoto } from "./image.js";
import { identifyPlant } from "./identify.js";
import { buildICS } from "./ics.js";

const config = {
  appName: "Plant Pal",
  plantnetApiKey: "",
  plantnetEndpoint: "https://my-api.plantnet.org/v2/identify/all",
  hemisphere: "north",
  ...(window.APP_CONFIG || {}),
};

const $ = (sel, root = document) => root.querySelector(sel);
const titleCase = (s) => s.replace(/(^|\s)\S/g, (c) => c.toUpperCase());
const displayName = (p) => p.nickname || p.name;
const interval = (p) => currentInterval(p, new Date(), config.hemisphere);

let plants = loadPlants();

// ── Persistence & feedback ───────────────────────────────────────────

function persist() {
  const ok = savePlants(plants);
  if (!ok) toast("Couldn't save — this device's storage is full. Export a backup and remove some plants.");
  return ok;
}

// Ask the browser not to evict our data under storage pressure (Chrome/Android honor this;
// on iPhone, adding the app to the Home Screen is what protects it).
function requestPersistentStorage() {
  navigator.storage?.persist?.().catch(() => {});
}

let toastTimer;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 3500);
}

// ── Plant list ───────────────────────────────────────────────────────

const TOX_LABEL = { toxic: "⚠️ Toxic to pets", mild: "Mildly toxic to pets", safe: "🐾 Pet-safe" };

function chip(text, cls = "") {
  const s = document.createElement("span");
  s.className = `chip ${cls}`;
  s.textContent = text;
  return s;
}

function renderPlant(p) {
  const li = $("#plant-tpl").content.firstElementChild.cloneNode(true);
  li.dataset.id = p.id;

  const img = $(".thumb img", li);
  if (p.photo) { img.src = p.photo; $(".thumb-fallback", li).remove(); }
  else img.remove();

  $(".plant-title", li).textContent = displayName(p);
  const sub = [
    p.nickname ? p.name : null,
    p.scientific && p.scientific.toLowerCase() !== p.name.toLowerCase() ? p.scientific : null,
  ].filter(Boolean).join(" · ");
  $(".plant-sub", li).textContent = sub;
  $(".plant-sub", li).hidden = !sub;

  const status = dueStatus(p.nextDue);
  const badge = $(".badge", li);
  badge.textContent = status.label;
  badge.className = `badge ${status.kind}`;
  badge.title = `Next watering: ${formatDate(p.nextDue)}`;

  const meta = $(".plant-meta", li);
  meta.append(chip(`Every ${interval(p)} days`), chip(`Next: ${formatDate(p.nextDue)}`));
  if (p.location === "outdoors") meta.append(chip("🌤 Outdoors"));
  if (p.tox) meta.append(chip(TOX_LABEL[p.tox], p.tox === "toxic" ? "toxic" : ""));
  if (p.dampCount === 1) meta.append(chip("Was damp last check"));

  let tip = p.tip || "";
  if (p.location === "outdoors") tip += " Outdoors: rain counts — check the soil before watering.";
  $(".plant-tip p", li).textContent = tip;
  return li;
}

function render() {
  const sorted = [...plants].sort(
    (a, b) => a.nextDue.localeCompare(b.nextDue) || displayName(a).localeCompare(displayName(b))
  );
  $("#plant-list").replaceChildren(...sorted.map(renderPlant));
  $("#empty-state").hidden = plants.length > 0;
}

// ── Plant actions ────────────────────────────────────────────────────

function markWatered(p) {
  const t = today();
  p.lastWatered = t;
  p.dampCount = 0;
  p.nextDue = addDays(t, interval(p));
  persist();
  render();
  toast(`💧 Watered! Next check ${formatDate(p.nextDue)}.`);
}

function markDamp(p) {
  p.dampCount = (p.dampCount || 0) + 1;
  let msg = "OK — we'll check again in 2 days.";
  if (p.dampCount >= 2) {
    // Two damp checks in a row: this plant drinks slower than we thought.
    // Add 1 day to the *current* interval (base is stored without the winter factor).
    p.baseInterval += 1 / seasonFactor(new Date(), config.hemisphere);
    p.dampCount = 0;
    msg = `Damp twice in a row — now every ${interval(p)} days. Check again in 2 days.`;
  }
  p.nextDue = addDays(today(), 2);
  persist();
  render();
  toast(msg);
}

function downloadCalendar(p) {
  const n = interval(p);
  const start = p.nextDue < today() ? today() : p.nextDue;
  const ics = buildICS({
    id: p.id,
    title: `Water ${displayName(p)}`,
    description: `Do the finger test first. ${p.tip || ""}\nRepeats every ${n} days (from ${config.appName}).`,
    startDate: start,
    everyDays: n,
    appName: config.appName,
  });
  const slug = displayName(p).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "plant";
  downloadBlob(new Blob([ics], { type: "text/calendar" }), `water-${slug}.ics`);
  toast("Calendar file downloaded — open it to add the reminder.");
}

function setConfirming(li, on) {
  $(".actions", li).hidden = on;
  $(".confirm", li).hidden = !on;
  if (on) {
    const p = plants.find((x) => x.id === li.dataset.id);
    $(".confirm-text", li).textContent = `Remove ${displayName(p)}?`;
    $('[data-act="cancel-remove"]', li).focus();
  } else {
    $('[data-act="remove"]', li).focus();
  }
}

$("#plant-list").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const li = btn.closest(".plant");
  const p = plants.find((x) => x.id === li.dataset.id);
  if (!p) return;

  switch (btn.dataset.act) {
    case "watered": return markWatered(p);
    case "damp": return markDamp(p);
    case "calendar": return downloadCalendar(p);
    case "remove": return setConfirming(li, true);
    case "cancel-remove": return setConfirming(li, false);
    case "confirm-remove":
      plants = plants.filter((x) => x !== p);
      persist();
      render();
      toast(`Removed ${displayName(p)}.`);
  }
});

// ── Add-plant sheet ──────────────────────────────────────────────────

const dialog = $("#add-dialog");
const form = $("#add-form");
const nameInput = $("#plant-name");
const intervalInput = $("#interval");

let draft; // state for the plant being added

function resetDraft() {
  draft?.request?.abort(); // cancel an identification still in flight
  if (draft?.previewUrl) URL.revokeObjectURL(draft.previewUrl);
  draft = {
    upload: null, thumb: null, previewUrl: null, request: null,
    matches: [], chosen: null, care: null, suggestion: null, intervalEdited: false,
  };
}

function setStatus(msg, isError = false) {
  const el = $("#id-status");
  el.textContent = msg;
  el.classList.toggle("error", isError);
}

function clearMatches() {
  draft.matches = [];
  draft.chosen = null;
  $("#matches").hidden = true;
  $("#match-list").replaceChildren();
}

function openAdd() {
  resetDraft();
  form.reset();
  $("#photo-preview").hidden = true;
  $("#photo-preview").removeAttribute("src");
  $("#photo-placeholder").hidden = false;
  $("#identify-btn").hidden = true;
  clearMatches();
  setStatus("");
  const lw = $("#last-watered");
  lw.value = lw.max = today();
  updateSchedule();
  dialog.showModal();
}

$("#add-btn").addEventListener("click", openAdd);
dialog.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) dialog.close(); });
dialog.addEventListener("close", resetDraft);

// Photo picked (camera or library) → resize → identify
async function onPhotoPicked(e) {
  const file = e.target.files[0];
  e.target.value = ""; // so picking the same file again still fires "change"
  if (!file) return;
  draft.request?.abort(); // a new photo replaces any identification in progress
  setStatus("Preparing photo…");
  try {
    const { upload, thumb } = await processPhoto(file);
    if (draft.previewUrl) URL.revokeObjectURL(draft.previewUrl);
    Object.assign(draft, { upload, thumb, previewUrl: URL.createObjectURL(upload) });
    const preview = $("#photo-preview");
    preview.src = draft.previewUrl;
    preview.hidden = false;
    $("#photo-placeholder").hidden = true;
    clearMatches();
    updateSchedule();

    if (config.plantnetApiKey) runIdentify();
    else setStatus("Photo added. (Photo ID is off — no API key in config.js.) Type the plant's name below.");
  } catch (err) {
    setStatus(err.message, true);
  }
}
$("#photo-input").addEventListener("change", onPhotoPicked);
$("#library-input").addEventListener("change", onPhotoPicked);

$("#identify-btn").addEventListener("click", runIdentify);

// Each photo is identified once. The button only appears to retry after an error,
// so the daily Pl@ntNet quota isn't spent on repeat lookups of the same photo.
async function runIdentify() {
  if (!draft.upload) return;
  const btn = $("#identify-btn");
  const current = draft;
  current.request?.abort();
  const request = (current.request = new AbortController());
  btn.hidden = true;
  setStatus("Identifying… 🌿");
  try {
    const { matches, remaining } = await identifyPlant(current.upload, {
      apiKey: config.plantnetApiKey,
      endpoint: config.plantnetEndpoint,
      signal: request.signal,
    });
    if (draft !== current || request.signal.aborted) return; // sheet closed or new photo
    if (!matches.length) throw new Error("No plant recognized. Type the name instead.");
    showMatches(matches);
    const notes = [];
    if (matches[0].score < 0.2) notes.push("Low confidence — double-check, or type the name yourself.");
    if (remaining !== null && remaining < 50) notes.push(`${remaining} photo IDs left today.`);
    setStatus(notes.join(" "));
  } catch (err) {
    if (draft !== current || request.signal.aborted) return;
    setStatus(err.message, true);
    btn.textContent = "🔍 Try again";
    btn.hidden = false;
  } finally {
    if (current.request === request) current.request = null;
  }
}

function showMatches(results) {
  draft.matches = results;
  const list = $("#match-list");
  const options = results.map((r, i) => {
    const label = document.createElement("label");
    label.className = "match";
    label.innerHTML = `<input type="radio" name="match" value="${i}"><span class="name"><strong></strong><em></em></span><span class="pct"></span>`;
    $("strong", label).textContent = r.common ? titleCase(r.common) : r.scientific;
    $("em", label).textContent = r.common ? r.scientific : r.family;
    $(".pct", label).textContent = `${Math.round(r.score * 100)}%`;
    return label;
  });
  const none = document.createElement("label");
  none.className = "match";
  none.innerHTML = `<input type="radio" name="match" value="none"><span class="name">None of these — I'll type it</span>`;
  list.replaceChildren(...options, none);
  $("#matches").hidden = false;
  if (results[0].score >= 0.5 && !nameInput.value.trim()) {
    $("input", options[0]).checked = true;
    pickMatch(0);
  }
}

function pickMatch(i) {
  draft.chosen = draft.matches[i];
  nameInput.value = draft.chosen.common ? titleCase(draft.chosen.common) : draft.chosen.scientific;
  updateSchedule();
}

$("#match-list").addEventListener("change", (e) => {
  const v = e.target.value;
  if (v === "none") {
    draft.chosen = null;
    nameInput.value = "";
    nameInput.focus();
    updateSchedule();
  } else {
    pickMatch(Number(v));
  }
});

nameInput.addEventListener("input", () => {
  // Typing over a picked match means the user is choosing something else.
  if (draft.chosen) {
    draft.chosen = null;
    const checked = $('#match-list input:checked');
    if (checked) checked.checked = false;
  }
  updateSchedule();
});

form.addEventListener("change", (e) => {
  if (e.target.name === "light" || e.target.name === "pot") updateSchedule();
});

intervalInput.addEventListener("input", () => {
  draft.intervalEdited = true;
  $("#interval-reset").hidden = Number(intervalInput.value) === draft.suggestion?.days;
});

$("#interval-reset").addEventListener("click", () => {
  draft.intervalEdited = false;
  updateSchedule();
});

const RANK_LABEL = { species: "species", genus: "genus", family: "plant family" };

function updateSchedule() {
  const name = nameInput.value.trim();
  const c = draft.chosen;
  const care = c
    ? findCare({ scientific: c.scientific, genus: c.genus, family: c.family })
    : findCare({ text: name });
  const s = suggestInterval(care, form.elements.light.value, form.elements.pot.value, new Date(), config.hemisphere);
  draft.care = care;
  draft.suggestion = s;

  let matchText;
  if (!name) matchText = "Enter a plant type to get a schedule.";
  else if (care.rank === "default") matchText = "Not in the care table — using a general schedule.";
  else {
    const common = care.common[0] ? titleCase(care.common[0]) : "";
    const label = common && common.toLowerCase() !== care.name.toLowerCase() ? `${common} (${care.name})` : care.name;
    matchText = `Care info: ${label} — matched by ${RANK_LABEL[care.rank]}`;
  }
  $("#care-match").textContent = matchText;

  const parts = [`Base ${care.days} days`, ...s.steps.map((st) => `${st.label} ${st.pct > 0 ? "+" : "−"}${Math.abs(st.pct)}%`)];
  $("#breakdown").textContent = `${parts.join(" · ")} → ${s.days} days`;

  if (!draft.intervalEdited) intervalInput.value = s.days;
  $("#interval-reset").hidden = !draft.intervalEdited || Number(intervalInput.value) === s.days;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  if (!name) {
    setStatus("Please enter a plant type.", true);
    nameInput.focus();
    return;
  }
  const days = parseInt(intervalInput.value, 10);
  if (!(days >= 1 && days <= 90)) {
    setStatus("Watering interval should be between 1 and 90 days.", true);
    intervalInput.focus();
    return;
  }

  const now = new Date();
  const t = today();
  const last = $("#last-watered").value && $("#last-watered").value <= t ? $("#last-watered").value : t;
  const care = draft.care;
  const plant = {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: titleCase(name),
    scientific: draft.chosen?.scientific || (care.rank === "species" ? care.name : ""),
    nickname: $("#nickname").value.trim(),
    careName: care.name,
    light: form.elements.light.value,
    pot: form.elements.pot.value,
    location: form.elements.location.value,
    tox: care.tox,
    tip: care.tip,
    // Store the interval *without* the winter factor so seasons re-apply automatically.
    baseInterval: days / seasonFactor(now, config.hemisphere),
    lastWatered: last,
    nextDue: addDays(last, days),
    dampCount: 0,
    photo: draft.thumb,
    addedAt: now.toISOString(),
  };

  plants.push(plant);
  if (!savePlants(plants)) {
    plants.pop();
    setStatus("Couldn't save — this device's storage is full. Export a backup and remove some plants.", true);
    return;
  }
  requestPersistentStorage();
  dialog.close();
  render();
  toast(`🌱 Added ${displayName(plant)}. Next water ${formatDate(plant.nextDue)}.`);
});

// Type-ahead suggestions from the care table
$("#plant-suggestions").replaceChildren(
  ...[...new Set(PLANTS.flatMap((p) => [...p.common.map(titleCase), ...(p.rank !== "family" ? [p.name] : [])]))]
    .sort()
    .map((v) => Object.assign(document.createElement("option"), { value: v }))
);

// ── Backup ───────────────────────────────────────────────────────────

$("#export-btn").addEventListener("click", () => {
  if (!plants.length) return toast("Nothing to export yet.");
  exportBackup(plants, config.appName);
});

$("#import-input").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = ""; // allow re-importing the same file
  if (!file) return;
  try {
    const incoming = await readBackup(file);
    // Merge: plants with the same id are replaced, new ones are added.
    const byId = new Map(plants.map((p) => [p.id, p]));
    for (const p of incoming) byId.set(p.id, p);
    plants = [...byId.values()];
    if (persist()) {
      render();
      toast(`Imported ${incoming.length} plant${incoming.length === 1 ? "" : "s"}.`);
    }
  } catch (err) {
    toast(err.message);
  }
});

// ── Theme toggle (auto → light → dark) ──────────────────────────────

const THEMES = ["auto", "light", "dark"];
const THEME_ICON = { auto: "◐", light: "☀️", dark: "🌙" };

function applyTheme(t) {
  if (t === "auto") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
  const btn = $("#theme-btn");
  btn.textContent = THEME_ICON[t];
  btn.setAttribute("aria-label", `Theme: ${t}`);
}

let theme = document.documentElement.dataset.theme || "auto";
applyTheme(theme);
$("#theme-btn").addEventListener("click", () => {
  theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
  applyTheme(theme);
  try {
    if (theme === "auto") localStorage.removeItem("plantApp.theme");
    else localStorage.setItem("plantApp.theme", theme);
  } catch {}
});

// ── Startup ──────────────────────────────────────────────────────────

document.title = config.appName;
$("#app-name").textContent = config.appName;
if (!plants.length) $("#soil-tip").open = true;
render();

// Badges depend on today's date — refresh when the app comes back into view.
document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch((err) => console.warn("SW registration failed", err));
}
