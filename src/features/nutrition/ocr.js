/* On-device OCR for nutrition labels (Tesseract.js, loaded only when needed).
   The photo never leaves the phone and is not stored — only the parsed numbers are kept. */

let workerP = null;
let onProgress = null;

async function getWorker() {
  if (!workerP) {
    workerP = import("tesseract.js").then(({ createWorker }) =>
      createWorker(["deu", "fra"], 1, {
        logger: (m) => onProgress?.(m.status === "recognizing text" ? 0.3 + m.progress * 0.7 : Math.min(0.3, (m.progress || 0) * 0.3)),
      }),
    ).catch((e) => { workerP = null; throw e; });
  }
  return workerP;
}

/** Downscale + greyscale + a bit of contrast: faster and more reliable OCR on phone photos. */
async function prepare(file) {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext("2d");
  ctx.filter = "grayscale(1) contrast(1.5)";
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close?.();
  return canvas;
}

/** Read the text of a label photo. `progress(0..1)` is called while it works. */
export async function readLabelText(file, progress) {
  onProgress = progress;
  try {
    const [worker, img] = await Promise.all([getWorker(), prepare(file)]);
    const { data } = await worker.recognize(img);
    img.width = img.height = 0; // free the pixels right away
    return data.text || "";
  } finally {
    onProgress = null;
  }
}
