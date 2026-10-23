// Client-side image resizing with <canvas>.

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Couldn't read that image.")); };
    img.src = url;
  });
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

/**
 * Prepare both images from one photo:
 *   upload – JPEG Blob, longest side ≤ 1280px (sent to Pl@ntNet)
 *   thumb  – 300×300 center-cropped JPEG data URL (stored in localStorage)
 */
export async function processPhoto(file) {
  const img = await loadImage(file);
  const w = img.naturalWidth, h = img.naturalHeight;

  // Upload-size version
  const scale = Math.min(1, 1280 / Math.max(w, h));
  const big = document.createElement("canvas");
  big.width = Math.round(w * scale);
  big.height = Math.round(h * scale);
  big.getContext("2d").drawImage(img, 0, 0, big.width, big.height);
  const upload = await canvasToBlob(big, 0.85);
  big.width = big.height = 0; // free canvas memory right away (iOS Safari has a tight canvas budget)

  // Square thumbnail (crop the center)
  const side = Math.min(w, h);
  const T = 300;
  const small = document.createElement("canvas");
  small.width = small.height = T;
  small.getContext("2d").drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, T, T);
  const thumb = small.toDataURL("image/jpeg", 0.7);
  small.width = small.height = 0;

  return { upload, thumb };
}
