const fs = require("node:fs/promises");
const path = require("node:path");
const { TextDecoder } = require("node:util");

const EOCD_SIGNATURE = 0x06054b50;
const ZIP64_EOCD_SIGNATURE = 0x06064b50;
const ZIP64_LOCATOR_SIGNATURE = 0x07064b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const ZIP64_LIMIT_32 = 0xffffffff;
const MAX_EOCD_SEARCH_BYTES = 128 * 1024;
const MAX_CENTRAL_DIRECTORY_BYTES = 8 * 1024 * 1024;
const MAX_PARSED_ENTRIES = 20000;
const MAX_SAMPLE_FILES = 80;
const MAX_SIGNAL_SAMPLES = 8;

const LAUNCH_EXTS = new Set(["exe", "bat", "cmd", "com", "lnk", "html"]);
const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "bmp", "webp", "tga", "dds", "gif", "psd"]);
const AUDIO_EXTS = new Set(["ogg", "mp3", "wav", "flac", "m4a", "aac", "opus", "mid", "midi"]);
const VIDEO_EXTS = new Set(["mp4", "webm", "avi", "wmv", "mpg", "mpeg", "mkv", "mov"]);
const SCRIPT_EXTS = new Set(["rpy", "rpyc", "ks", "tjs", "tpm", "txt", "json", "csv", "xml", "ini", "lua", "js"]);
const RESOURCE_ARCHIVES = new Set(["rpa", "rpi", "xp3", "nsa", "ns2", "sar", "arc", "pck", "dat", "pak", "wolf", "cpk", "pac", "vol", "iro"]);
const COMMERCIAL_RESOURCE_ARCHIVES = new Set(["arc", "dat", "pak", "pck", "cpk", "pac", "vol", "iro", "wolf"]);
const KIRIKIRI_LAUNCHERS = new Set(["krkr.exe", "krkrz.exe", "kirikiri.exe", "kag.exe"]);
const KIRIKIRI_SCRIPT_HINTS = new Set(["startup.tjs", "config.tjs", "envinit.tjs"]);

async function previewArchiveFile(filePath, ext) {
  if (ext !== "zip") return null;
  return previewZipFile(filePath);
}

async function previewZipFile(filePath) {
  let handle;
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) return null;
    handle = await fs.open(filePath, "r");
    return await readZipPreview(handle, stat.size);
  } catch (error) {
    return makeUnavailablePreview("error", `ZIP directory preview failed: ${error.message || "unknown error"}`);
  } finally {
    await handle?.close();
  }
}

async function readZipPreview(handle, fileSize) {
  if (fileSize < 22) return makeUnavailablePreview("error", "ZIP file is too small to contain a directory.");

  const tailLength = Math.min(fileSize, MAX_EOCD_SEARCH_BYTES);
  const tailStart = fileSize - tailLength;
  const tail = await readAt(handle, tailLength, tailStart);
  const eocdOffsetInTail = findLastSignature(tail, EOCD_SIGNATURE, Math.max(0, tail.length - 22));

  if (eocdOffsetInTail < 0) {
    return makeUnavailablePreview("unsupported", "ZIP end directory was not found.");
  }

  const eocdOffset = tailStart + eocdOffsetInTail;
  const directoryInfo = await readDirectoryInfo(handle, tail, tailStart, eocdOffsetInTail, eocdOffset);
  if (!directoryInfo) {
    return makeUnavailablePreview("unsupported", "ZIP64 directory metadata is not supported in this file.");
  }

  const { centralDirectoryOffset, centralDirectorySize, totalEntries } = directoryInfo;
  if (!Number.isSafeInteger(centralDirectoryOffset) || !Number.isSafeInteger(centralDirectorySize)) {
    return makeUnavailablePreview("unsupported", "ZIP directory is too large for a safe metadata preview.");
  }

  if (centralDirectoryOffset < 0 || centralDirectoryOffset >= fileSize) {
    return makeUnavailablePreview("error", "ZIP directory offset is outside the file.");
  }

  const bytesToRead = Math.min(centralDirectorySize, MAX_CENTRAL_DIRECTORY_BYTES);
  const centralDirectory = await readAt(handle, bytesToRead, centralDirectoryOffset);
  return parseCentralDirectory(centralDirectory, totalEntries, centralDirectorySize > bytesToRead);
}

async function readDirectoryInfo(handle, tail, tailStart, eocdOffsetInTail, eocdOffset) {
  const totalEntries = tail.readUInt16LE(eocdOffsetInTail + 10);
  const centralDirectorySize = tail.readUInt32LE(eocdOffsetInTail + 12);
  const centralDirectoryOffset = tail.readUInt32LE(eocdOffsetInTail + 16);
  const needsZip64 =
    totalEntries === 0xffff ||
    centralDirectorySize === ZIP64_LIMIT_32 ||
    centralDirectoryOffset === ZIP64_LIMIT_32;

  if (!needsZip64) {
    return {
      totalEntries,
      centralDirectorySize,
      centralDirectoryOffset,
    };
  }

  const locator = await readZip64Locator(handle, tail, tailStart, eocdOffset);
  if (!locator) return null;
  const record = await readAt(handle, 56, locator.recordOffset);
  if (record.readUInt32LE(0) !== ZIP64_EOCD_SIGNATURE) return null;

  return {
    totalEntries: safeBigIntToNumber(record.readBigUInt64LE(32)),
    centralDirectorySize: safeBigIntToNumber(record.readBigUInt64LE(40)),
    centralDirectoryOffset: safeBigIntToNumber(record.readBigUInt64LE(48)),
  };
}

async function readZip64Locator(handle, tail, tailStart, eocdOffset) {
  const locatorOffset = eocdOffset - 20;
  if (locatorOffset < 0) return null;
  const locator =
    locatorOffset >= tailStart
      ? tail.subarray(locatorOffset - tailStart, locatorOffset - tailStart + 20)
      : await readAt(handle, 20, locatorOffset);

  if (locator.length < 20 || locator.readUInt32LE(0) !== ZIP64_LOCATOR_SIGNATURE) return null;
  return {
    recordOffset: safeBigIntToNumber(locator.readBigUInt64LE(8)),
  };
}

function parseCentralDirectory(buffer, totalEntries, directoryBytesTruncated) {
  const preview = {
    schema: "galaid.archivePreview.v1",
    format: "ZIP",
    status: "ok",
    totalEntries,
    scannedEntries: 0,
    fileCount: 0,
    directoryCount: 0,
    encryptedEntries: 0,
    truncated: Boolean(directoryBytesTruncated),
    warnings: [],
    sampleFiles: [],
    signals: {
      launchCandidateCount: 0,
      launchSamples: [],
      engineHints: [],
      assetCounts: {
        images: 0,
        audio: 0,
        video: 0,
        scripts: 0,
        resourceArchives: 0,
        commercialArchives: 0,
      },
    },
  };
  const engineHints = new Map();
  let offset = 0;

  while (offset + 46 <= buffer.length && preview.scannedEntries < MAX_PARSED_ENTRIES) {
    if (buffer.readUInt32LE(offset) !== CENTRAL_DIRECTORY_SIGNATURE) break;

    const flags = buffer.readUInt16LE(offset + 8);
    const compressedSize = readZip32Size(buffer, offset + 20);
    const uncompressedSize = readZip32Size(buffer, offset + 24);
    const filenameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const entryEnd = offset + 46 + filenameLength + extraLength + commentLength;
    if (entryEnd > buffer.length) {
      preview.truncated = true;
      break;
    }

    const rawName = buffer.subarray(offset + 46, offset + 46 + filenameLength);
    const decoded = decodeZipName(rawName, flags);
    const entryPath = normalizeZipPath(decoded.path);
    preview.scannedEntries += 1;
    if ((flags & 0x1) === 0x1) preview.encryptedEntries += 1;

    if (entryPath) {
      const isDirectory = entryPath.endsWith("/");
      if (isDirectory) {
        preview.directoryCount += 1;
      } else {
        const entry = makeEntry(entryPath, uncompressedSize, compressedSize);
        preview.fileCount += 1;
        if (preview.sampleFiles.length < MAX_SAMPLE_FILES) preview.sampleFiles.push(entry);
        collectSignals(preview.signals, engineHints, entry);
      }
    }

    if (decoded.warning && !preview.warnings.includes(decoded.warning)) preview.warnings.push(decoded.warning);
    offset = entryEnd;
  }

  if (preview.scannedEntries < totalEntries) preview.truncated = true;
  if (preview.encryptedEntries) preview.warnings.push(`${preview.encryptedEntries} encrypted entries were detected.`);
  if (preview.signals.launchCandidateCount && preview.signals.assetCounts.commercialArchives >= 2) {
    addEngineHint(engineHints, "commercial-proprietary", "商业/自研引擎（文件结构）", preview.signals.launchSamples[0]);
  }
  preview.signals.engineHints = [...engineHints.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  return preview;
}

function makeEntry(entryPath, size, compressedSize) {
  const normalized = normalizeZipPath(entryPath);
  const name = path.posix.basename(normalized);
  return {
    path: normalized,
    name,
    ext: getExt(name),
    size: size || 0,
    compressedSize: compressedSize || 0,
    depth: Math.max(0, normalized.split("/").filter(Boolean).length - 1),
  };
}

function collectSignals(signals, engineHints, entry) {
  const lower = entry.path.toLowerCase();
  if (LAUNCH_EXTS.has(entry.ext) && !isSetupLike(lower)) {
    signals.launchCandidateCount += 1;
    pushLimited(signals.launchSamples, entry.path);
  }
  if (IMAGE_EXTS.has(entry.ext)) signals.assetCounts.images += 1;
  if (AUDIO_EXTS.has(entry.ext)) signals.assetCounts.audio += 1;
  if (VIDEO_EXTS.has(entry.ext)) signals.assetCounts.video += 1;
  if (SCRIPT_EXTS.has(entry.ext)) signals.assetCounts.scripts += 1;
  if (RESOURCE_ARCHIVES.has(entry.ext)) signals.assetCounts.resourceArchives += 1;
  if (COMMERCIAL_RESOURCE_ARCHIVES.has(entry.ext)) signals.assetCounts.commercialArchives += 1;

  if (
    entry.ext === "xp3" ||
    entry.ext === "tjs" ||
    entry.ext === "tpm" ||
    KIRIKIRI_LAUNCHERS.has(entry.name.toLowerCase()) ||
    KIRIKIRI_SCRIPT_HINTS.has(entry.name.toLowerCase()) ||
    lower.includes("kirikiri") ||
    lower.includes("krkr") ||
    lower.endsWith(".ks") ||
    lower.includes("/scenario/") ||
    lower.includes("/system/")
  ) {
    addEngineHint(engineHints, "kirikiri", "KiriKiri / 吉里吉里", entry.path);
  }
  if (entry.ext === "rpa" || entry.ext === "rpy" || entry.ext === "rpyc" || lower.includes("/renpy/")) {
    addEngineHint(engineHints, "renpy", "Ren'Py", entry.path);
  }
  if (["nsa", "ns2", "sar"].includes(entry.ext) || lower.includes("nscript")) {
    addEngineHint(engineHints, "nscript", "NScripter / ONScripter", entry.path);
  }
  if (lower.includes("/www/") || entry.name === "Game.ini" || /^rgss\d+.*\.dll$/i.test(entry.name)) {
    addEngineHint(engineHints, "rpgmaker", "RPG Maker", entry.path);
  }
  if (entry.ext === "unity3d" || entry.name === "UnityPlayer.dll" || lower.includes("_data/")) {
    addEngineHint(engineHints, "unity", "Unity", entry.path);
  }
  if (entry.ext === "sig" || lower.includes("siglusengine")) {
    addEngineHint(engineHints, "siglus", "SiglusEngine", entry.path);
  }
}

function addEngineHint(engineHints, id, name, sample) {
  if (!engineHints.has(id)) engineHints.set(id, { id, name, count: 0, samples: [] });
  const hint = engineHints.get(id);
  hint.count += 1;
  pushLimited(hint.samples, sample);
}

function pushLimited(items, value) {
  if (items.length < MAX_SIGNAL_SAMPLES && !items.includes(value)) items.push(value);
}

function isSetupLike(lowerPath) {
  return /(setup|install|unins|uninstall|config|update|patch|redist|vcredist|directx|dxsetup)/i.test(lowerPath);
}

function readZip32Size(buffer, offset) {
  const value = buffer.readUInt32LE(offset);
  return value === ZIP64_LIMIT_32 ? 0 : value;
}

function decodeZipName(rawName, flags) {
  if ((flags & 0x800) === 0x800) {
    return { path: rawName.toString("utf8"), warning: null };
  }

  const utf8 = rawName.toString("utf8");
  if (!utf8.includes("\uFFFD")) return { path: utf8, warning: null };

  const shiftJis = decodeWithTextDecoder(rawName, "shift_jis");
  if (shiftJis && countReplacementChars(shiftJis) < countReplacementChars(utf8)) {
    return { path: shiftJis, warning: "Some ZIP names used legacy Japanese encoding." };
  }
  return { path: utf8, warning: "Some ZIP names could not be decoded cleanly." };
}

function decodeWithTextDecoder(buffer, encoding) {
  try {
    return new TextDecoder(encoding).decode(buffer);
  } catch {
    return "";
  }
}

function countReplacementChars(value) {
  return (String(value).match(/\uFFFD/g) || []).length;
}

function normalizeZipPath(value) {
  return String(value || "")
    .replaceAll("\\", "/")
    .replace(/^\/+/, "")
    .replace(/^[A-Za-z]:\//, "");
}

function getExt(name) {
  const index = String(name || "").lastIndexOf(".");
  return index >= 0 ? name.slice(index + 1).toLowerCase() : "";
}

function findLastSignature(buffer, signature, start) {
  for (let index = start; index >= 0; index -= 1) {
    if (buffer.readUInt32LE(index) === signature) return index;
  }
  return -1;
}

async function readAt(handle, length, position) {
  const buffer = Buffer.alloc(length);
  const { bytesRead } = await handle.read(buffer, 0, length, position);
  return bytesRead === length ? buffer : buffer.subarray(0, bytesRead);
}

function safeBigIntToNumber(value) {
  return value > BigInt(Number.MAX_SAFE_INTEGER) ? Number.MAX_SAFE_INTEGER : Number(value);
}

function makeUnavailablePreview(status, message) {
  return {
    schema: "galaid.archivePreview.v1",
    format: "ZIP",
    status,
    totalEntries: 0,
    scannedEntries: 0,
    fileCount: 0,
    directoryCount: 0,
    encryptedEntries: 0,
    truncated: false,
    warnings: [message],
    sampleFiles: [],
    signals: {
      launchCandidateCount: 0,
      launchSamples: [],
      engineHints: [],
      assetCounts: {
        images: 0,
        audio: 0,
        video: 0,
        scripts: 0,
        resourceArchives: 0,
        commercialArchives: 0,
      },
    },
  };
}

module.exports = {
  previewArchiveFile,
  previewZipFile,
};
