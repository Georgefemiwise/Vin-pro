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

  // Common OCR confusions. Only repair characters in otherwise VIN-shaped chunks.
  for (const candidate of [...candidates]) {
    candidates.add(candidate
      .replace(/^O/, "0")
      .replace(/O/g, "0")
      .replace(/I/g, "1")
      .replace(/Q/g, "0"));
  }

  return [...candidates].filter((x) => x.length === 17 && [...x].every((c) => VIN_CHARS.includes(c)));
}

function preprocess(source: HTMLImageElement | ImageBitmap, scale = 2.5, threshold = 145) {
  const width = "naturalWidth" in source ? source.naturalWidth : source.width;
  const height = "naturalHeight" in source ? source.naturalHeight : source.height;
  const maxWidth = 1800;
  const ratio = Math.min(1, maxWidth / width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(width * ratio * scale));
  canvas.height = Math.max(1, Math.floor(height * ratio * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not prepare image for OCR.");

  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < image.data.length; i += 4) {
    const gray = 0.299 * image.data[i] + 0.587 * image.data[i + 1] + 0.114 * image.data[i + 2];
    const boosted = Math.max(0, Math.min(255, (gray - 128) * 1.55 + 128));
    const value = boosted > threshold ? 255 : 0;
    image.data[i] = image.data[i + 1] = image.data[i + 2] = value;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

export async function recognizeVin(file: File, onProgress?: (progress: number) => void) {
  const bitmap = await createImageBitmap(file);
  const worker = await createWorker("eng", 1, {
    logger: (message) => {
      if (typeof message.progress === "number") onProgress?.(message.progress);
    },
  });

  try {
    await worker.setParameters({
      tessedit_char_whitelist: VIN_CHARS,
      tessedit_pageseg_mode: PSM.SINGLE_LINE,
      preserve_interword_spaces: "0",
    });

    const attempts = [
      preprocess(bitmap, 2.2, 150),
      preprocess(bitmap, 3.0, 128),
    ];

    let allText = "";
    for (const image of attempts) {
      const { data } = await worker.recognize(image);
      allText += ` ${data.text}`;
      const candidates = extractVinCandidates(data.text);
      if (candidates.length) return { vin: candidates[0], rawText: data.text };
    }

    const candidates = extractVinCandidates(allText);
    if (!candidates.length) throw new Error("No 17-character VIN was detected. Try a closer, sharper photo.");
    return { vin: candidates[0], rawText: allText.trim() };
  } finally {
    await worker.terminate();
    bitmap.close();
  }
}