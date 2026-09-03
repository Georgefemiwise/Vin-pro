import { createWorker, PSM } from "tesseract.js";

const VIN_CHARS = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789";

export function extractVinCandidates(text: string): string[] {
  const normalized = text
    .toUpperCase()
    .replace(/[\s|_\-:.,/\\()[\]{}]/g, "")
    .replace(/[^A-Z0-9]/g, "");

  const candidates = new Set<string>();
  if (normalized.length === 17) candidates.add(normalized);

  for (let i = 0; i <= normalized.length - 17; i++) {
    const chunk = normalized.slice(i, i + 17);
    if (/^[A-HJ-NPR-Z0-9]{17}$/.test(chunk)) candidates.add(chunk);
  }

  // I, O, Q are illegal in VINs — fix common OCR confusions
  for (const c of [...candidates]) {
    candidates.add(c.replace(/O/g, "0").replace(/I/g, "1").replace(/Q/g, "0"));
  }

  return [...candidates].filter(
    (x) => x.length === 17 && [...x].every((c) => VIN_CHARS.includes(c))
  );
}

/* ── Canvas factory ────────────────────────────────────────────────────── */

function buildCanvas(source: ImageBitmap, scale: number) {
  const maxW = 2400;
  const s = Math.min(scale, maxW / Math.max(source.width, 1));
  const w = Math.max(1, Math.round(source.width * s));
  const h = Math.max(1, Math.round(source.height * s));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, w, h);
  return { canvas, ctx, w, h };
}

/* ── Strategy A  —  WHITE text on any background ───────────────────────
 *
 * Use min(R,G,B) as the "whiteness" measure.
 *   • Truly white pixels:  min ≈ 250  (all channels high)
 *   • Blue sky:            min ≈ 80–130 (red channel is low)
 *   • Frosted/light plate: min ≈ 185–200 (below threshold)
 *   • Hand / dark areas:   min ≈ 20–80
 *
 * Pixels above `thresh` are "white text" → paint BLACK for Tesseract.
 * Everything else → WHITE (background).
 *
 * This directly fixes the transparent / hologram / frosted-plate VIN case
 * where both text and background appear bright after standard grayscale.
 */
function prepWhiteText(
  source: ImageBitmap,
  scale = 2.5,
  thresh = 215
): HTMLCanvasElement {
  const { canvas, ctx, w, h } = buildCanvas(source, scale);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const whiteness = Math.min(d[i], d[i + 1], d[i + 2]); // high only for true-white
    d[i] = d[i + 1] = d[i + 2] = whiteness > thresh ? 0 : 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/* ── Strategy B  —  DARK text on light background (standard) ──────────── */
function prepDarkText(
  source: ImageBitmap,
  scale = 2.5,
  thresh = 140
): HTMLCanvasElement {
  const { canvas, ctx, w, h } = buildCanvas(source, scale);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const boosted = Math.max(0, Math.min(255, (g - 128) * 1.6 + 128));
    d[i] = d[i + 1] = d[i + 2] = boosted > thresh ? 255 : 0;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/* ── Strategy C  —  Histogram stretch + threshold ─────────────────────
 * Handles dim images or uneven lighting by normalising the tonal range
 * before binarising.
 */
function prepContrastStretch(source: ImageBitmap, scale = 2.5): HTMLCanvasElement {
  const { canvas, ctx, w, h } = buildCanvas(source, scale);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;

  const grays = new Float32Array(w * h);
  for (let i = 0; i < d.length; i += 4) {
    grays[i >> 2] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
  }

  const sorted = Float32Array.from(grays).sort();
  const lo = sorted[Math.floor(sorted.length * 0.05)] ?? 0;
  const hi = sorted[Math.floor(sorted.length * 0.95)] ?? 255;
  const range = (hi - lo) || 1;

  for (let j = 0; j < grays.length; j++) {
    const s = Math.max(0, Math.min(255, ((grays[j] - lo) / range) * 255));
    const i = j << 2;
    d[i] = d[i + 1] = d[i + 2] = s > 128 ? 255 : 0;
  }

  ctx.putImageData(img, 0, 0);
  return canvas;
}

/* ── Recognition pipeline ──────────────────────────────────────────────
 *
 * Ordered so the most common failure mode (white-on-light) is tried first.
 * Each strategy produces a binary canvas. Tesseract runs on each in turn;
 * we stop as soon as a valid 17-char VIN is extracted.
 */
function strategies(bitmap: ImageBitmap): Array<() => HTMLCanvasElement> {
  return [
    // White / light text (hologram plates, frosted stickers, transparent overlays)
    () => prepWhiteText(bitmap, 2.5, 215),
    () => prepWhiteText(bitmap, 3.0, 205),
    () => prepWhiteText(bitmap, 2.5, 230),  // very bright white text
    () => prepWhiteText(bitmap, 2.0, 200),  // slightly off-white text
    // Dark text (standard printed/embossed VIN labels)
    () => prepDarkText(bitmap, 2.5, 140),
    () => prepDarkText(bitmap, 3.0, 115),
    // Low-contrast / mixed lighting
    () => prepContrastStretch(bitmap, 2.5),
    () => prepContrastStretch(bitmap, 3.0),
  ];
}

/* ── Public API ────────────────────────────────────────────────────────── */

export async function recognizeVin(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ vin: string; rawText: string }> {
  const bitmap = await createImageBitmap(file);

  const worker = await createWorker("eng", 1, {
    logger: (msg: { status: string; progress: number }) => {
      if (msg.status === "recognizing text") onProgress?.(msg.progress);
    },
  });

  try {
    await worker.setParameters({
      tessedit_char_whitelist: VIN_CHARS,
      tessedit_pageseg_mode: PSM.SINGLE_LINE,
      preserve_interword_spaces: "0",
    });

    const steps = strategies(bitmap);
    let allText = "";

    for (const build of steps) {
      const canvas = build();
      const { data } = await worker.recognize(canvas);
      allText += ` ${data.text}`;

      const hits = extractVinCandidates(data.text);
      if (hits.length) return { vin: hits[0], rawText: data.text };
    }

    // Final attempt: search the combined output of all runs
    const hits = extractVinCandidates(allText);
    if (!hits.length) {
      throw new Error(
        "No VIN detected. Tips: fill the frame with the VIN, ensure good lighting, and hold the camera steady."
      );
    }
    return { vin: hits[0], rawText: allText.trim() };
  } finally {
    await worker.terminate();
    bitmap.close();
  }
}
