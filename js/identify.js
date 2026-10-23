// Pl@ntNet identification. Docs: https://my.plantnet.org/doc/openapi

/**
 * Send a photo to Pl@ntNet and return up to 3 matches:
 *   [{ scientific, genus, family, common, score }]
 * Throws an Error with a user-friendly message on failure.
 */
export async function identifyPlant(imageBlob, { apiKey, endpoint }) {
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

  let res;
  try {
    res = await fetch(url, { method: "POST", body: form });
  } catch {
    throw new Error("Couldn't reach Pl@ntNet. Check your connection, or type the name instead.");
  }

  if (!res.ok) {
    const messages = {
      400: "Pl@ntNet couldn't use that photo. Try a clearer, closer shot of the leaves.",
      401: "The Pl@ntNet API key is invalid. Check config.js.",
      403: "This website isn't authorized for the API key. Add the domain in your Pl@ntNet account settings.",
      404: "No match found. Try another angle, or type the name.",
      413: "Photo too large.",
      429: "Daily identification limit reached. Type the name instead, or try tomorrow.",
    };
    throw new Error(messages[res.status] || `Pl@ntNet error (${res.status}). Type the name instead.`);
  }

  const data = await res.json();
  return (data.results || []).slice(0, 3).map((r) => ({
    scientific: r.species?.scientificNameWithoutAuthor || "",
    genus: r.species?.genus?.scientificNameWithoutAuthor || "",
    family: r.species?.family?.scientificNameWithoutAuthor || "",
    common: r.species?.commonNames?.[0] || "",
    score: r.score || 0,
  }));
}
