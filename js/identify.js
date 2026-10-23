// Pl@ntNet identification. Docs: https://my.plantnet.org/doc/openapi

const TIMEOUT_MS = 30000;

/**
 * Send a photo to Pl@ntNet.
 * Returns { matches: [{ scientific, genus, family, common, score }] (max 3), remaining }
 *   remaining = identifications left today (null if Pl@ntNet didn't say).
 * Throws an Error with a user-friendly message on failure.
 * Pass `signal` (from an AbortController) to cancel; a cancelled call throws an AbortError.
 */
export async function identifyPlant(imageBlob, { apiKey, endpoint, signal }) {
  if (!apiKey) throw new Error("Photo ID isn't set up (no API key in config.js). Type the plant's name instead.");
  if (!navigator.onLine) throw new Error("You're offline. Type the plant's name instead.");

  const url = new URL(endpoint);
  url.searchParams.set("api-key", apiKey);
  url.searchParams.set("lang", "en");
  url.searchParams.set("nb-results", "3");
  url.searchParams.set("include-related-images", "false");

  const form = new FormData();
  form.append("organs", "auto"); // let Pl@ntNet decide leaf / flower / whole plant
  form.append("images", imageBlob, "plant.jpg");

  // Give up after TIMEOUT_MS, or when the caller cancels.
  const timeout = AbortSignal.timeout?.(TIMEOUT_MS);
  const signals = [signal, timeout].filter(Boolean);
  const combined = signals.length > 1 && AbortSignal.any ? AbortSignal.any(signals) : signals[0];

  let res;
  try {
    res = await fetch(url, { method: "POST", body: form, signal: combined });
  } catch (err) {
    if (signal?.aborted) throw err; // cancelled on purpose — caller ignores it
    if (err.name === "TimeoutError") throw new Error("Pl@ntNet is taking too long. Try again, or type the name instead.");
    throw new Error("Couldn't reach Pl@ntNet. Check your connection, or type the name instead.");
  }

  if (!res.ok) {
    const messages = {
      400: "Pl@ntNet couldn't use that photo. Try a clearer, closer shot of the leaves.",
      401: "The Pl@ntNet API key is invalid. Check config.js.",
      403: "This website isn't authorized for the API key. Check the authorized domains in your Pl@ntNet settings.",
      404: "No plant recognized. Try a closer photo of a leaf, or type the name.",
      413: "Photo too large.",
      429: "Daily identification limit reached. Type the name instead, or try tomorrow.",
    };
    throw new Error(messages[res.status] || `Pl@ntNet error (${res.status}). Type the name instead.`);
  }

  const data = await res.json();
  return {
    remaining: Number.isFinite(data.remainingIdentificationRequests) ? data.remainingIdentificationRequests : null,
    matches: (data.results || []).slice(0, 3).map((r) => ({
      scientific: r.species?.scientificNameWithoutAuthor || "",
      genus: r.species?.genus?.scientificNameWithoutAuthor || "",
      family: r.species?.family?.scientificNameWithoutAuthor || "",
      common: r.species?.commonNames?.[0] || "",
      score: r.score || 0,
    })),
  };
}
