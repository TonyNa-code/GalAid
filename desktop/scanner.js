const fs = require("node:fs/promises");
const path = require("node:path");
const { previewArchiveFile } = require("./archive-preview");

const SCAN_PROGRESS_BATCH = 1000;
const TEXT_PREVIEW_MAX_BYTES = 16 * 1024;
const EXECUTABLE_INFO_HEADER_BYTES = 256 * 1024;
const EXECUTABLE_INFO_EXTS = new Set(["exe", "com"]);
const RUNTIME_IMPORT_HINTS = [
  { id: "legacy-directdraw", pattern: /^(ddraw|d3dim)\.dll$/i },
  { id: "legacy-direct3d", pattern: /^(d3d8|d3d9|d3drm|d3dx9_\d+)\.dll$/i },
  { id: "legacy-directsound", pattern: /^(dsound|xaudio2_\d+|xactengine\d+_\d+|x3daudio\d+_\d+)\.dll$/i },
  { id: "legacy-directinput", pattern: /^dinput8?\.dll$/i },
  { id: "legacy-winmm", pattern: /^(winmm|msacm32|avifil32)\.dll$/i },
  { id: "legacy-vc", pattern: /^(msvcr\d+|msvcp\d+|vcruntime\d+)\.dll$/i },
  { id: "legacy-vb6", pattern: /^msvbvm60\.dll$/i },
  { id: "legacy-dotnet", pattern: /^mscoree\.dll$/i },
  { id: "legacy-quicktime", pattern: /^(qtmlclient\.dll|quicktime\.qts)$/i },
  { id: "legacy-directshow", pattern: /^(quartz|amstream|msvfw32|mciavi32|mciqtz32)\.dll$/i },
  { id: "legacy-flash", pattern: /^(flash|flash\d+|swflash)\.ocx$/i },
  { id: "legacy-borland", pattern: /^(borlndmm|cc3260mt)\.dll$|^(rtl|vcl|vclx|vcldb|vcljpg)\d+\.bpl$/i },
];

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
  const subsystemVersion = readPeVersion(header, optionalHeaderOffset + 48);
  const osVersion = readPeVersion(header, optionalHeaderOffset + 40);
  const runtimeImports = getRuntimeImportDlls(readPeImportedDlls(header, offset, optionalHeaderOffset, optionalMagic));
  const importHints = getRuntimeImportHints(runtimeImports);

  const info = {
    format: "pe",
    runtime,
    bitness,
    architecture,
    osVersion,
    subsystemVersion,
    targetEra: getPeTargetEra(runtime, subsystemVersion),
    subsystem: getPeSubsystemName(readUInt16(header, optionalHeaderOffset + 68)),
    label: `${bitness} Windows PE executable`,
    route: "native-windows",
    confidence: "high",
  };
  if (runtimeImports.length) info.runtimeImports = runtimeImports;
  if (importHints.length) info.importHints = importHints;
  return makeExecutableInfo(info);
}

function readUInt16(buffer, offset) {
  return offset + 2 <= buffer.length ? buffer.readUInt16LE(offset) : 0;
}

function readUInt32(buffer, offset) {
  return offset + 4 <= buffer.length ? buffer.readUInt32LE(offset) : 0;
}

function readPeVersion(buffer, offset) {
  const major = readUInt16(buffer, offset);
  const minor = readUInt16(buffer, offset + 2);
  return major || minor ? `${major}.${minor}` : "";
}

function getPeTargetEra(runtime, subsystemVersion) {
  if (runtime !== "win32" || !subsystemVersion) return "";
  const major = Number.parseInt(String(subsystemVersion).split(".")[0] || "", 10);
  if (!Number.isFinite(major) || major <= 0) return "";
  if (major < 5) return "win95-nt4-era";
  if (major === 5) return "win2000-xp-era";
  return "";
}

function readPeImportedDlls(header, peOffset, optionalHeaderOffset, optionalMagic) {
  const dataDirectoryOffset = optionalHeaderOffset + (optionalMagic === 0x20b ? 112 : 96);
  const importDirectoryRva = readUInt32(header, dataDirectoryOffset + 8);
  if (!importDirectoryRva) return [];

  const sections = readPeSections(header, peOffset, optionalHeaderOffset);
  const importDirectoryOffset = rvaToFileOffset(importDirectoryRva, sections);
  if (importDirectoryOffset < 0) return [];

  const dlls = [];
  for (let index = 0; index < 64; index += 1) {
    const descriptorOffset = importDirectoryOffset + index * 20;
    if (descriptorOffset + 20 > header.length) break;
    const originalFirstThunk = readUInt32(header, descriptorOffset);
    const timeDateStamp = readUInt32(header, descriptorOffset + 4);
    const forwarderChain = readUInt32(header, descriptorOffset + 8);
    const nameRva = readUInt32(header, descriptorOffset + 12);
    const firstThunk = readUInt32(header, descriptorOffset + 16);
    if (!originalFirstThunk && !timeDateStamp && !forwarderChain && !nameRva && !firstThunk) break;

    const nameOffset = rvaToFileOffset(nameRva, sections);
    const name = readNullTerminatedAscii(header, nameOffset, 128).toLowerCase();
    if (name && /\.(dll|ocx|bpl|qts)$/i.test(name) && !dlls.includes(name)) dlls.push(name);
  }
  return dlls;
}

function readPeSections(header, peOffset, optionalHeaderOffset) {
  const numberOfSections = readUInt16(header, peOffset + 6);
  const sizeOfOptionalHeader = readUInt16(header, peOffset + 20);
  const sectionTableOffset = optionalHeaderOffset + sizeOfOptionalHeader;
  const sections = [];
  for (let index = 0; index < Math.min(numberOfSections, 32); index += 1) {
    const sectionOffset = sectionTableOffset + index * 40;
    if (sectionOffset + 40 > header.length) break;
    sections.push({
      virtualSize: readUInt32(header, sectionOffset + 8),
      virtualAddress: readUInt32(header, sectionOffset + 12),
      rawSize: readUInt32(header, sectionOffset + 16),
      rawPointer: readUInt32(header, sectionOffset + 20),
    });
  }
  return sections;
}

function rvaToFileOffset(rva, sections) {
  for (const section of sections) {
    const span = Math.max(section.virtualSize, section.rawSize);
    if (rva >= section.virtualAddress && rva < section.virtualAddress + span) {
      return section.rawPointer + (rva - section.virtualAddress);
    }
  }
  return -1;
}

function readNullTerminatedAscii(buffer, offset, maxLength) {
  if (offset < 0 || offset >= buffer.length) return "";
  const end = Math.min(buffer.length, offset + maxLength);
  let cursor = offset;
  while (cursor < end && buffer[cursor] !== 0) cursor += 1;
  if (cursor === offset || cursor >= end) return "";
  return buffer.toString("ascii", offset, cursor).replace(/[^\w. -]/g, "");
}

function getRuntimeImportDlls(importedDlls) {
  return importedDlls
    .filter((dll) => RUNTIME_IMPORT_HINTS.some((hint) => hint.pattern.test(dll)))
    .slice(0, 24);
}

function getRuntimeImportHints(runtimeImports) {
  return RUNTIME_IMPORT_HINTS
    .filter((hint) => runtimeImports.some((dll) => hint.pattern.test(dll)))
    .map((hint) => hint.id);
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
  const archivePreview = await previewArchiveFile(file.fullPath, file.ext, {
    allowSelfExtractingExecutable: shouldPreviewSelfExtractingExecutable(file),
  });
  return archivePreview ? { ...file, archivePreview } : file;
}

function shouldPreviewSelfExtractingExecutable(file) {
  if (!file?.fullPath || file.ext !== "exe" || file.size <= 0) return false;
  if (file.depth === 0) return true;
  const lowerPath = String(file.lowerPath || file.path || file.name || "").toLowerCase();
  return file.depth <= 1 && /(sfx|self.?extract|extract|unpack|archive|package|setup|install|patch|update)/i.test(lowerPath);
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
