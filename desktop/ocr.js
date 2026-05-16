const fs = require("node:fs");
const path = require("node:path");
const { createWorker, PSM } = require("tesseract.js");

const OCR_LANGUAGES = "eng+jpn+chi_sim";
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const SUPPORTED_IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".bmp", ".webp", ".tif", ".tiff"]);

async function recognizeErrorImage(imagePath, options = {}) {
  const normalizedPath = path.resolve(String(imagePath || ""));
  validateImagePath(normalizedPath);

  const worker = await createWorker(OCR_LANGUAGES, 1, {
    cachePath: options.cachePath,
    corePath: resolvePackagedDependencyPath("node_modules/tesseract.js-core"),
    workerPath: resolvePackagedDependencyPath("node_modules/tesseract.js/dist/worker.min.js"),
    logger: (message) => {
      options.onProgress?.({
        status: message.status || "recognizing text",
        progress: Number.isFinite(message.progress) ? message.progress : 0,
      });
    },
  });

  try {
    await worker.setParameters({
      preserve_interword_spaces: "1",
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      user_defined_dpi: "120",
    });
    const result = await worker.recognize(normalizedPath);
    const text = normalizeOcrText(result?.data?.text || "");
    return {
      ok: true,
      imagePath: normalizedPath,
      imageName: path.basename(normalizedPath),
      text,
      confidence: Number.isFinite(result?.data?.confidence) ? Math.round(result.data.confidence) : null,
    };
  } finally {
    await worker.terminate();
  }
}

function validateImagePath(imagePath) {
  const stat = fs.statSync(imagePath);
  if (!stat.isFile()) throw new Error("Selected path is not an image file.");
  if (stat.size > MAX_IMAGE_BYTES) throw new Error("Image is too large for quick OCR.");
  const ext = path.extname(imagePath).toLowerCase();
  if (!SUPPORTED_IMAGE_EXTS.has(ext)) throw new Error("Unsupported image format.");
}

function normalizeOcrText(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 4000);
}

function resolvePackagedDependencyPath(relativePath) {
  const candidate = path.join(__dirname, "..", relativePath);
  if (candidate.includes(`${path.sep}app.asar${path.sep}`)) {
    const unpacked = candidate.replace(`${path.sep}app.asar${path.sep}`, `${path.sep}app.asar.unpacked${path.sep}`);
    if (fs.existsSync(unpacked)) return unpacked;
  }
  return candidate;
}

module.exports = {
  normalizeOcrText,
  recognizeErrorImage,
};
