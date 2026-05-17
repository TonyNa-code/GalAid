const fs = require("node:fs/promises");
const path = require("node:path");
const { previewArchiveFile } = require("./archive-preview");

const SCAN_PROGRESS_BATCH = 1000;
const TEXT_PREVIEW_MAX_BYTES = 16 * 1024;

async function scanSelectedPaths(selectedPaths, onProgress = () => {}) {
  const files = [];
  let scanned = 0;
  let skipped = 0;

  for (const selectedPath of selectedPaths) {
    const stat = await fs.stat(selectedPath);
    if (stat.isDirectory()) {
      const rootParent = path.dirname(selectedPath);
      const stack = [selectedPath];
      while (stack.length) {
        const current = stack.pop();
        let entries = [];
        try {
          entries = await fs.readdir(current, { withFileTypes: true });
        } catch {
          skipped += 1;
          continue;
        }

        for (const entry of entries) {
          const absolutePath = path.join(current, entry.name);
          if (entry.isSymbolicLink()) {
            skipped += 1;
            continue;
          }
          if (entry.isDirectory()) {
            stack.push(absolutePath);
            continue;
          }
          if (!entry.isFile()) {
            skipped += 1;
            continue;
          }

          const fileStat = await safeStat(absolutePath);
          if (!fileStat) {
            skipped += 1;
            continue;
          }
          files.push(await enrichFileRecord(toFileRecord(absolutePath, path.relative(rootParent, absolutePath), fileStat.size)));
          scanned += 1;
          if (scanned % SCAN_PROGRESS_BATCH === 0) onProgress({ scanned, skipped });
        }
      }
    } else if (stat.isFile()) {
      files.push(await enrichFileRecord(toFileRecord(selectedPath, path.basename(selectedPath), stat.size)));
      scanned += 1;
    }
  }

  onProgress({ scanned, skipped, done: true });
  return { files, skipped, scanned };
}

async function enrichFileRecord(file) {
  return withArchivePreview(await withTextPreview(file));
}

async function withArchivePreview(file) {
  const archivePreview = await previewArchiveFile(file.fullPath, file.ext);
  return archivePreview ? { ...file, archivePreview } : file;
}

async function withTextPreview(file) {
  if (!shouldReadTextPreview(file)) return file;
  try {
    const text = await fs.readFile(file.fullPath, "utf8");
    return { ...file, textPreview: text.slice(0, TEXT_PREVIEW_MAX_BYTES) };
  } catch {
    return file;
  }
}

function shouldReadTextPreview(file) {
  return Boolean(
    file?.fullPath &&
      file.name?.toLowerCase() === "autorun.inf" &&
      file.size > 0 &&
      file.size <= TEXT_PREVIEW_MAX_BYTES,
  );
}

async function safeStat(filePath) {
  try {
    return await fs.stat(filePath);
  } catch {
    return null;
  }
}

function toFileRecord(absolutePath, relativePath, size) {
  const normalized = normalizePath(relativePath || path.basename(absolutePath));
  const name = path.basename(absolutePath);
  return {
    name,
    path: normalized,
    lowerPath: normalized.toLowerCase(),
    ext: getExt(name),
    size,
    depth: Math.max(0, normalized.split("/").filter(Boolean).length - 1),
    fullPath: absolutePath,
  };
}

function normalizePath(value) {
  return String(value || "").replaceAll(path.sep, "/").replace(/^\/+/, "");
}

function getExt(name) {
  const index = String(name || "").lastIndexOf(".");
  return index >= 0 ? name.slice(index + 1).toLowerCase() : "";
}

module.exports = {
  scanSelectedPaths,
  toFileRecord,
};
