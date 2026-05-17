const fs = require("node:fs/promises");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { TextDecoder } = require("node:util");
const { getBundledSevenZipPath } = require("./package-prep");
const ENGINE_RULES = require("../data/engine-rules.json");

const EOCD_SIGNATURE = 0x06054b50;
const ZIP64_EOCD_SIGNATURE = 0x06064b50;
const ZIP64_LOCATOR_SIGNATURE = 0x07064b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const ZIP64_LIMIT_32 = 0xffffffff;
const MAX_EOCD_SEARCH_BYTES = 128 * 1024;
const MAX_CENTRAL_DIRECTORY_BYTES = 8 * 1024 * 1024;
const MAX_EXTERNAL_LIST_BYTES = 8 * 1024 * 1024;
const MAX_PARSED_ENTRIES = 20000;
const MAX_SAMPLE_FILES = 80;
const MAX_SIGNAL_SAMPLES = 8;
const EXTERNAL_LIST_TIMEOUT_MS = 12000;

const LAUNCH_EXTS = new Set(["exe", "bat", "cmd", "com", "lnk", "html"]);
const INSTALLER_EXTS = new Set(["msi", "cab", "inf"]);
const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "bmp", "webp", "tga", "dds", "gif", "psd"]);
const AUDIO_EXTS = new Set(["ogg", "mp3", "wav", "flac", "m4a", "aac", "opus", "mid", "midi"]);
const VIDEO_EXTS = new Set(["mp4", "webm", "avi", "wmv", "mpg", "mpeg", "mkv", "mov"]);
const SCRIPT_EXTS = new Set(["rpy", "rpyc", "ks", "tjs", "tpm", "txt", "json", "csv", "xml", "ini", "lua", "js"]);
const RESOURCE_ARCHIVES = new Set(["rpa", "rpi", "xp3", "nsa", "ns2", "sar", "arc", "pck", "dat", "pak", "wolf", "cpk", "pac", "vol", "iro", "ypf", "int", "gxp", "noa", "med", "wsm"]);
const COMMERCIAL_RESOURCE_ARCHIVES = new Set(getEngineRuleExtensions("commercial-proprietary", ["arc", "dat", "pak", "pck", "cpk", "pac", "vol", "iro", "wolf", "ypf", "int", "gxp", "noa", "med", "wsm"]));
const DISC_EXTS = new Set(["iso", "mdf", "mds", "cue", "bin", "ccd", "img", "nrg", "sub", "isz", "cdi", "bwt", "bwi", "bws", "bwa", "b5t", "b5i", "b6t", "b6i", "mdx", "daa", "uif", "pdi"]);

async function previewArchiveFile(filePath, ext) {
  const previewKind = getPreviewKind(filePath, ext);
  if (!previewKind) return null;
  if (previewKind.kind === "zip") return previewZipFile(filePath);
  if (previewKind.kind === "external-list") return previewExternalArchiveFile(filePath, previewKind.format);
  if (previewKind.kind === "disc-image") return previewDiscImageFile(filePath, previewKind.ext);
  return null;
}

async function previewZipFile(filePath) {
  let handle;
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) return null;
    handle = await fs.open(filePath, "r");
    return await readZipPreview(handle, stat.size);
  } catch (error) {
    return makeUnavailablePreview("error", "ZIP", `ZIP directory preview failed: ${error.message || "unknown error"}`);
  } finally {
    await handle?.close();
  }
}

function getPreviewKind(filePath, ext) {
  const lowerName = path.basename(filePath).toLowerCase();
  const normalizedExt = String(ext || "").toLowerCase();
  const rarPart = lowerName.match(/\.part0*(\d+)\.rar$/);

  if (normalizedExt === "zip" && !/\.zip\.\d{3}$/.test(lowerName)) return { kind: "zip", format: "ZIP" };
  if (normalizedExt === "7z" || /\.7z\.001$/.test(lowerName)) return { kind: "external-list", format: "7Z" };
  if (normalizedExt === "rar" && (!rarPart || Number(rarPart[1]) === 1)) return { kind: "external-list", format: "RAR" };
  if (/\.zip\.001$/.test(lowerName)) return { kind: "external-list", format: "ZIP split" };
  if (/\.r\d{2}$/.test(lowerName)) return null;
  if (DISC_EXTS.has(normalizedExt)) return { kind: "disc-image", format: `${normalizedExt.toUpperCase()} disc image`, ext: normalizedExt };
  return null;
}

async function previewExternalArchiveFile(filePath, format) {
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) return null;
  } catch (error) {
    return makeUnavailablePreview("error", format, `${format} metadata preview failed: ${error.message || "unknown error"}`);
  }

  const result = await runExternalList(filePath);
  if (result.missing) {
    return makeUnavailablePreview(
      "tool-missing",
      format,
      `${format} metadata preview needs a bundled or local 7z-compatible command. GalAid will not extract or upload this archive.`,
    );
  }

  if (result.timedOut) {
    return makeUnavailablePreview(
      "timeout",
      format,
      `${format} metadata preview timed out while listing the archive directory.`,
    );
  }

  if (result.error) {
    return makeUnavailablePreview(
      "error",
      format,
      `${format} metadata preview failed: ${result.error.message || "unknown error"}`,
    );
  }

  const warnings = ["Listed with a local 7z-compatible command; no files were extracted."];
  if (result.truncated) warnings.push("External listing output was truncated.");
  if (result.code !== 0) warnings.push(`7z-compatible listing exited with code ${result.code}.`);
  if (result.stderr && result.code !== 0) warnings.push(trimMessage(result.stderr));

  const preview = parseSevenZipListOutput(result.stdout, format, {
    warnings,
    truncated: result.truncated,
  });

  if (!preview.scannedEntries && result.code !== 0) {
    return makeUnavailablePreview(
      "error",
      format,
      `${format} metadata preview could not read a safe directory listing.`,
    );
  }

  return preview;
}

async function previewDiscImageFile(filePath, ext) {
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) return null;
    const format = `${String(ext || "disc").toUpperCase()} disc image`;
    const preview = makeBasePreview(format, {
      packageKind: "disc-image",
      totalEntries: 1,
      warnings: getDiscImageWarnings(ext),
    });
    const entry = makeEntry(path.basename(filePath), stat.size, stat.size);
    preview.scannedEntries = 1;
    preview.fileCount = 1;
    preview.sampleFiles.push(entry);
    collectSignals(preview.signals, new Map(), entry);
    return preview;
  } catch (error) {
    return makeUnavailablePreview(
      "error",
      `${String(ext || "disc").toUpperCase()} disc image`,
      `Disc image metadata preview failed: ${error.message || "unknown error"}`,
      "disc-image",
    );
  }
}

async function readZipPreview(handle, fileSize) {
  if (fileSize < 22) return makeUnavailablePreview("error", "ZIP", "ZIP file is too small to contain a directory.");

  const tailLength = Math.min(fileSize, MAX_EOCD_SEARCH_BYTES);
  const tailStart = fileSize - tailLength;
  const tail = await readAt(handle, tailLength, tailStart);
  const eocdOffsetInTail = findLastSignature(tail, EOCD_SIGNATURE, Math.max(0, tail.length - 22));

  if (eocdOffsetInTail < 0) {
    return makeUnavailablePreview("unsupported", "ZIP", "ZIP end directory was not found.");
  }

  const eocdOffset = tailStart + eocdOffsetInTail;
  const directoryInfo = await readDirectoryInfo(handle, tail, tailStart, eocdOffsetInTail, eocdOffset);
  if (!directoryInfo) {
    return makeUnavailablePreview("unsupported", "ZIP", "ZIP64 directory metadata is not supported in this file.");
  }

  const { centralDirectoryOffset, centralDirectorySize, totalEntries } = directoryInfo;
  if (!Number.isSafeInteger(centralDirectoryOffset) || !Number.isSafeInteger(centralDirectorySize)) {
    return makeUnavailablePreview("unsupported", "ZIP", "ZIP directory is too large for a safe metadata preview.");
  }

  if (centralDirectoryOffset < 0 || centralDirectoryOffset >= fileSize) {
    return makeUnavailablePreview("error", "ZIP", "ZIP directory offset is outside the file.");
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
  const preview = makeBasePreview("ZIP", {
    totalEntries,
    truncated: Boolean(directoryBytesTruncated),
  });
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

function parseSevenZipListOutput(output, format = "7Z", options = {}) {
  const preview = makeBasePreview(format, {
    warnings: options.warnings || [],
    truncated: Boolean(options.truncated),
  });
  const engineHints = new Map();
  const records = parseKeyValueRecords(output);

  for (const record of records) {
    if (preview.scannedEntries >= MAX_PARSED_ENTRIES) {
      preview.truncated = true;
      break;
    }

    if (!record.Path || record.Type) continue;
    const entryPath = normalizeZipPath(record.Path);
    if (!entryPath || entryPath === "." || entryPath === "..") continue;

    preview.scannedEntries += 1;
    const isDirectory = record.Folder === "+" || entryPath.endsWith("/");
    if (record.Encrypted === "+") preview.encryptedEntries += 1;

    if (isDirectory) {
      preview.directoryCount += 1;
      continue;
    }

    const entry = makeEntry(entryPath, parseDecimalSize(record.Size), parseDecimalSize(record["Packed Size"]));
    preview.fileCount += 1;
    if (preview.sampleFiles.length < MAX_SAMPLE_FILES) preview.sampleFiles.push(entry);
    collectSignals(preview.signals, engineHints, entry);
  }

  if (records.length > MAX_PARSED_ENTRIES) preview.truncated = true;
  if (preview.encryptedEntries) preview.warnings.push(`${preview.encryptedEntries} encrypted entries were detected.`);
  if (preview.signals.launchCandidateCount && preview.signals.assetCounts.commercialArchives >= 2) {
    addEngineHint(engineHints, "commercial-proprietary", "商业/自研引擎（文件结构）", preview.signals.launchSamples[0]);
  }
  preview.signals.engineHints = [...engineHints.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  return preview;
}

function parseKeyValueRecords(output) {
  const records = [];
  let record = {};

  for (const line of String(output || "").split(/\r?\n/)) {
    if (!line.trim()) {
      if (Object.keys(record).length) records.push(record);
      record = {};
      continue;
    }
    const index = line.indexOf(" = ");
    if (index <= 0) continue;
    record[line.slice(0, index)] = line.slice(index + 3);
  }

  if (Object.keys(record).length) records.push(record);
  return records;
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

function getEngineRule(id) {
  return ENGINE_RULES.find((rule) => rule.id === id) || null;
}

function getEngineRuleExtensions(id, fallback = []) {
  const extensions = getEngineRule(id)?.match?.extensions;
  return Array.isArray(extensions) && extensions.length ? extensions.map((ext) => ext.toLowerCase()) : fallback;
}

function collectSignals(signals, engineHints, entry) {
  const lower = entry.path.toLowerCase();
  if (LAUNCH_EXTS.has(entry.ext) && !isSetupLike(lower)) {
    signals.launchCandidateCount += 1;
    pushLimited(signals.launchSamples, entry.path);
  }
  if (isInstallerLike(lower, entry.ext)) {
    signals.installerCount += 1;
    pushLimited(signals.installerSamples, entry.path);
  }
  const runtimeRepairType = getRuntimeRepairType(entry.path, entry.ext);
  if (runtimeRepairType) {
    signals.runtimeRepairCount += 1;
    pushLimited(signals.runtimeRepairSamples, `${runtimeRepairType}: ${entry.path}`);
  }
  if (IMAGE_EXTS.has(entry.ext)) signals.assetCounts.images += 1;
  if (AUDIO_EXTS.has(entry.ext)) signals.assetCounts.audio += 1;
  if (VIDEO_EXTS.has(entry.ext)) signals.assetCounts.video += 1;
  if (SCRIPT_EXTS.has(entry.ext)) signals.assetCounts.scripts += 1;
  if (RESOURCE_ARCHIVES.has(entry.ext)) signals.assetCounts.resourceArchives += 1;
  if (COMMERCIAL_RESOURCE_ARCHIVES.has(entry.ext)) signals.assetCounts.commercialArchives += 1;

  for (const rule of ENGINE_RULES) {
    if (rule.id === "commercial-proprietary") continue;
    if (matchesEngineRule(rule, entry)) addEngineHint(engineHints, rule.id, rule.name, entry.path);
  }
}

function matchesEngineRule(rule, entry) {
  const match = rule?.match || {};
  const lowerName = entry.name.toLowerCase();
  const lowerPath = entry.path.toLowerCase();

  if (arrayIncludesLower(match.extensions, entry.ext)) return true;
  if (arrayIncludesLower(match.filenames, lowerName)) return true;
  if (arraySome(match.pathIncludes, (pattern) => lowerPath.includes(normalizeRulePathPattern(pattern)))) return true;
  if (arraySome(match.pathEndsWith, (pattern) => lowerPath.endsWith(normalizeRulePathPattern(pattern)))) return true;
  if (arraySome(match.filenameRegex, (pattern) => safeRegexTest(pattern, entry.name))) return true;
  if (arraySome(match.pathRegex, (pattern) => safeRegexTest(pattern, entry.path))) return true;
  if (entry.ext === "dll" && arraySome(match.dllNameIncludes, (pattern) => lowerName.includes(pattern.toLowerCase()))) return true;

  return false;
}

function normalizeRulePathPattern(pattern) {
  return pattern.replace(/\\/g, "/").toLowerCase();
}

function arrayIncludesLower(values, candidate) {
  return Array.isArray(values) && values.some((value) => value.toLowerCase() === candidate);
}

function arraySome(values, predicate) {
  return Array.isArray(values) && values.some((value) => typeof value === "string" && predicate(value));
}

function safeRegexTest(pattern, value) {
  try {
    return new RegExp(pattern, "i").test(value);
  } catch {
    return false;
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
  return /(setup|install|unins|uninstall|config|update|patch|redist|vcredist|directx|dxsetup|append|bonus|extra|tokuten|特典|追加|免dvd|免cd|no.?dvd|no.?cd|crack|keygen|serial)/i.test(lowerPath);
}

function isInstallerLike(lowerPath, ext) {
  return (
    INSTALLER_EXTS.has(ext) ||
    /(^|\/)(setup|install|installer|autorun|dxsetup|vcredist|vc_redist|directx|patch|update|append|bonus|extra|tokuten|serial|keygen|crack|no.?dvd|no.?cd)(\.[a-z0-9]+)?$/i.test(lowerPath) ||
    /(\/redist\/|\/support\/|\/directx\/|\/patch\/|\/update\/|\/bonus\/|\/extra\/|\/tokuten\/|\/特典\/|\/追加\/|data\d+\.cab$|autorun\.inf$|免dvd|免cd|no.?dvd|no.?cd)/i.test(lowerPath)
  );
}

function getRuntimeRepairType(entryPath, ext = getExt(path.posix.basename(String(entryPath || "")))) {
  const lowerPath = normalizeZipPath(entryPath).toLowerCase();
  if (!["exe", "msi", "zip", "rar", "7z"].includes(String(ext || "").toLowerCase())) return "";

  if (
    /(^|\/)(dxsetup|dxwebsetup)\.exe$/.test(lowerPath) ||
    /(?:directx|direct.?x|d3dx).*?(?:setup|install|redist|runtime)/.test(lowerPath) ||
    /(?:setup|install|redist|runtime).*?(?:directx|direct.?x|d3dx)/.test(lowerPath)
  ) {
    return "DirectX";
  }

  if (
    /(^|\/)(vcredist|vc_redist|vc_red|visual.?c).*?\.(exe|msi|zip|rar|7z)$/.test(lowerPath) ||
    /(?:vcredist|vc_redist|visual.?c|microsoft.*c\+\+|msvc|redist\/vc)/.test(lowerPath)
  ) {
    return "VC++";
  }

  const hasRtpMarker = /(^|[\/_. -])rtp([\/_. -]|$)|runtime package|ランタイム/.test(lowerPath);
  const hasRpgMakerMarker = /rpg.?maker|rpgvxace|rpgvx|rpgxp|vxace|rgss|rpg2000|rpg2003/.test(lowerPath);
  if (hasRtpMarker && hasRpgMakerMarker) return "RPG Maker RTP";

  return "";
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

function getDiscImageWarnings(ext) {
  const normalizedExt = String(ext || "").toLowerCase();
  if (["cue", "mds", "ccd", "bwt", "b5t", "b6t"].includes(normalizedExt)) {
    return ["Descriptor metadata only; keep the paired image/data files in the same folder."];
  }
  if (["bin", "mdf", "img", "sub", "bwi", "bws", "bwa", "b5i", "b6i"].includes(normalizedExt)) {
    return ["Image data file metadata only; keep the matching descriptor files together."];
  }
  if (["nrg", "isz", "cdi", "mdx", "daa", "uif", "pdi"].includes(normalizedExt)) {
    return ["Legacy disc image metadata only; extraction or mounting support depends on the local 7z-compatible tool or image driver."];
  }
  return ["Disc image metadata only; use the desktop prepare action to mount or extract and rescan when available."];
}

async function runExternalList(filePath) {
  const candidates = getExternalListCandidates();
  for (const command of candidates) {
    const result = await runExternalListCommand(command, filePath);
    if (result.error?.code === "ENOENT") continue;
    return result;
  }
  return { missing: true };
}

function getExternalListCandidates() {
  return [...new Set([process.env.GALAID_7Z_PATH, getBundledSevenZipPath(), "7zz", "7z", "7za"].filter(Boolean))];
}

function runExternalListCommand(command, filePath) {
  return new Promise((resolve) => {
    let settled = false;
    let stdout = "";
    let stderr = "";
    let truncated = false;
    let timer;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve({
        command: path.basename(command),
        stdout,
        stderr,
        truncated,
        ...result,
      });
    };

    const child = spawn(command, ["l", "-slt", "-ba", filePath], {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    timer = setTimeout(() => {
      child.kill();
      finish({ timedOut: true });
    }, EXTERNAL_LIST_TIMEOUT_MS);

    child.stdout?.on("data", (chunk) => {
      const text = chunk.toString("utf8");
      if (stdout.length + text.length > MAX_EXTERNAL_LIST_BYTES) {
        truncated = true;
        stdout += text.slice(0, Math.max(0, MAX_EXTERNAL_LIST_BYTES - stdout.length));
        child.kill();
      } else {
        stdout += text;
      }
    });
    child.stderr?.on("data", (chunk) => {
      const text = chunk.toString("utf8");
      if (stderr.length + text.length <= 64 * 1024) stderr += text;
    });
    child.on("error", (error) => finish({ error }));
    child.on("close", (code) => finish({ code }));
  });
}

function trimMessage(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 220);
}

function getExt(name) {
  const index = String(name || "").lastIndexOf(".");
  return index >= 0 ? name.slice(index + 1).toLowerCase() : "";
}

function parseDecimalSize(value) {
  const parsed = Number.parseInt(String(value || "0"), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
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

function makeBasePreview(format, options = {}) {
  return {
    schema: "galaid.archivePreview.v1",
    format,
    packageKind: options.packageKind || "archive",
    status: options.status || "ok",
    totalEntries: options.totalEntries || 0,
    scannedEntries: 0,
    fileCount: 0,
    directoryCount: 0,
    encryptedEntries: 0,
    truncated: Boolean(options.truncated),
    warnings: [...(options.warnings || [])],
    sampleFiles: [],
    signals: {
      launchCandidateCount: 0,
      launchSamples: [],
      installerCount: 0,
      installerSamples: [],
      runtimeRepairCount: 0,
      runtimeRepairSamples: [],
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

function makeUnavailablePreview(status, format, message, packageKind = "archive") {
  return makeBasePreview(format, {
    packageKind,
    status,
    warnings: [message],
  });
}

module.exports = {
  parseSevenZipListOutput,
  previewDiscImageFile,
  previewArchiveFile,
  previewZipFile,
};
