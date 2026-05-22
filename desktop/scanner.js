const fs = require("node:fs/promises");
const path = require("node:path");
const { previewArchiveFile } = require("./archive-preview");

const SCAN_PROGRESS_BATCH = 1000;
const TEXT_PREVIEW_MAX_BYTES = 16 * 1024;
const EXECUTABLE_INFO_HEADER_BYTES = 4096;
const EXECUTABLE_INFO_EXTS = new Set(["exe", "com"]);

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
  return withArchivePreview(await withTextPreview(await withExecutableInfo(file)));
}

async function withExecutableInfo(file) {
  if (!shouldReadExecutableInfo(file)) return file;
  try {
    const executableInfo = await readExecutableInfo(file);
    return executableInfo ? { ...file, executableInfo } : file;
  } catch {
    return file;
  }
}

function shouldReadExecutableInfo(file) {
  return Boolean(file?.fullPath && EXECUTABLE_INFO_EXTS.has(file.ext) && file.size > 0);
}

async function readExecutableInfo(file) {
  const header = await readFilePrefix(file.fullPath, Math.min(file.size, EXECUTABLE_INFO_HEADER_BYTES));
  if (file.ext === "com" && !hasMzSignature(header)) return makeDosComInfo();
  return readExecutableInfoFromHeader(header);
}

async function readFilePrefix(filePath, length) {
  const handle = await fs.open(filePath, "r");
  try {
    const buffer = Buffer.alloc(length);
    const { bytesRead } = await handle.read(buffer, 0, length, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

function readExecutableInfoFromHeader(header) {
  if (!header || header.length < 2) return null;
  if (!hasMzSignature(header)) {
    return makeExecutableInfo({
      format: "unknown-executable",
      runtime: "unknown",
      bitness: "",
      label: "Unknown executable",
      route: "inspect",
      confidence: "low",
    });
  }

  if (header.length < 0x40) return makeDosMzInfo();
  const newHeaderOffset = header.readUInt32LE(0x3c);
  if (!newHeaderOffset || newHeaderOffset + 2 > header.length) return makeDosMzInfo();

  const signature2 = header.toString("ascii", newHeaderOffset, newHeaderOffset + 2);
  if (signature2 === "NE") {
    return makeExecutableInfo({
      format: "ne",
      runtime: "win16",
      bitness: "16-bit",
      label: "Windows NE / Win16 executable",
      route: "win16-vm",
      confidence: "high",
    });
  }
  if (signature2 === "LE" || signature2 === "LX") {
    return makeExecutableInfo({
      format: signature2.toLowerCase(),
      runtime: "legacy-linear",
      bitness: "32-bit",
      label: `${signature2} legacy linear executable`,
      route: "legacy-runtime",
      confidence: "medium",
    });
  }

  if (newHeaderOffset + 4 <= header.length && header.toString("binary", newHeaderOffset, newHeaderOffset + 4) === "PE\u0000\u0000") {
    return readPeExecutableInfo(header, newHeaderOffset);
  }

  return makeDosMzInfo();
}

function hasMzSignature(header) {
  return Boolean(header && header.length >= 2 && header[0] === 0x4d && header[1] === 0x5a);
}

function readPeExecutableInfo(header, offset) {
  const machine = readUInt16(header, offset + 4);
  const optionalHeaderOffset = offset + 24;
  const optionalMagic = readUInt16(header, optionalHeaderOffset);
  const bitness = optionalMagic === 0x20b ? "64-bit" : "32-bit";
  const runtime = bitness === "64-bit" ? "win64" : "win32";
  const architecture = getPeMachineArchitecture(machine);

  return makeExecutableInfo({
    format: "pe",
    runtime,
    bitness,
    architecture,
    subsystem: getPeSubsystemName(readUInt16(header, optionalHeaderOffset + 68)),
    label: `${bitness} Windows PE executable`,
    route: "native-windows",
    confidence: "high",
  });
}

function readUInt16(buffer, offset) {
  return offset + 2 <= buffer.length ? buffer.readUInt16LE(offset) : 0;
}

function getPeMachineArchitecture(machine) {
  const architectures = {
    0x014c: "x86",
    0x8664: "x64",
    0x01c0: "arm",
    0xaa64: "arm64",
  };
  if (architectures[machine]) return architectures[machine];
  return machine ? `machine-0x${machine.toString(16)}` : "";
}

function getPeSubsystemName(subsystem) {
  const subsystems = {
    2: "windows-gui",
    3: "windows-console",
    9: "windows-ce",
    10: "efi-application",
  };
  return subsystems[subsystem] || "";
}

function makeDosMzInfo() {
  return makeExecutableInfo({
    format: "mz",
    runtime: "dos",
    bitness: "16-bit",
    label: "DOS MZ executable",
    route: "dosbox",
    confidence: "medium",
  });
}

function makeDosComInfo() {
  return makeExecutableInfo({
    format: "dos-com",
    runtime: "dos",
    bitness: "16-bit",
    label: "DOS COM executable",
    route: "dosbox",
    confidence: "medium",
  });
}

function makeExecutableInfo(info) {
  return {
    schema: "galaid.executableInfo.v1",
    ...info,
  };
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
  readExecutableInfoFromHeader,
  scanSelectedPaths,
  toFileRecord,
};
