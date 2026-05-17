const fs = require("node:fs/promises");
const path = require("node:path");
const { spawn } = require("node:child_process");

const ARCHIVE_EXTS = new Set(["zip", "rar", "7z", "tar", "tgz", "gz", "gzip", "bz2", "bzip2", "xz", "txz", "lzma", "zst", "lzh", "lha", "cab", "arj"]);
const SPLIT_NUMBERED_VOLUME_RE = /\.(7z|zip)\.(\d{3})$/i;
const RAR_PART_RE = /\.part0*(\d+)\.rar$/i;
const OLD_RAR_VOLUME_RE = /\.r\d{2}$/i;
const ZIP_FOLLOW_UP_VOLUME_RE = /\.z\d{2}$/i;
const MAX_OUTPUT_BYTES = 512 * 1024;
const EXTRACTION_TIMEOUT_MS = 30 * 60 * 1000;
const ISO_MOUNT_TIMEOUT_MS = 90 * 1000;
const DISC_IMAGE_EXTS = new Set(["iso", "cue", "bin", "mdf", "mds", "ccd", "img", "nrg", "sub", "isz", "cdi", "bwt", "bwi", "bws", "bwa", "b5t", "b5i", "b6t", "b6i", "mdx", "daa", "uif", "pdi"]);

async function prepareLocalPackage(options = {}) {
  const support = getPackagePrepareSupport(options.packagePath);
  if (!support.supported) return { ok: false, errorCode: support.errorCode, message: support.message };
  if (support.kind === "disc-image") return prepareDiscImagePackage(options);
  return prepareArchivePackage(options);
}

async function prepareArchivePackage({
  packagePath,
  outputDirectory,
  password = "",
  onProgress = () => {},
  spawnImpl = spawn,
  statImpl = fs.stat,
  mkdirImpl = fs.mkdir,
} = {}) {
  const normalizedPackagePath = path.resolve(packagePath || "");
  const normalizedOutputDirectory = path.resolve(outputDirectory || "");
  const support = getArchivePrepareSupport(normalizedPackagePath);

  if (!support.supported) {
    return { ok: false, errorCode: support.errorCode, message: support.message };
  }

  try {
    const stat = await statImpl(normalizedPackagePath);
    if (!stat.isFile()) return { ok: false, errorCode: "not-file", message: "Package path is not a file." };
  } catch {
    return { ok: false, errorCode: "not-found", message: "Package file was not found." };
  }

  await mkdirImpl(normalizedOutputDirectory, { recursive: true });
  onProgress({ phase: "extracting", packageName: path.basename(normalizedPackagePath), scanned: 0 });

  const result = await runSevenZipExtract({
    packagePath: normalizedPackagePath,
    outputDirectory: normalizedOutputDirectory,
    password,
    spawnImpl,
  });

  if (result.ok) {
    const nestedTar = await expandNestedTarIfNeeded({
      packagePath: normalizedPackagePath,
      outputDirectory: normalizedOutputDirectory,
      spawnImpl,
      statImpl,
    });
    if (!nestedTar.ok) return nestedTar;

    return {
      ok: true,
      packagePath: normalizedPackagePath,
      outputDirectory: normalizedOutputDirectory,
      tool: result.tool,
      nestedArchive: nestedTar.nestedArchive || "",
      nestedTool: nestedTar.tool || "",
      passwordUsed: Boolean(password),
    };
  }

  return result;
}

function getArchivePrepareSupport(filePath) {
  const lowerName = path.basename(filePath || "").toLowerCase();
  const ext = getExt(lowerName);
  const rarPart = lowerName.match(RAR_PART_RE);
  const numberedVolume = lowerName.match(SPLIT_NUMBERED_VOLUME_RE);

  if (OLD_RAR_VOLUME_RE.test(lowerName)) {
    return {
      supported: false,
      errorCode: "follow-up-volume",
      message: "This is a follow-up RAR volume. Start from the matching .rar file instead.",
    };
  }

  if (rarPart && Number(rarPart[1]) !== 1) {
    return {
      supported: false,
      errorCode: "follow-up-volume",
      message: "This is a follow-up RAR part. Start from part1.rar instead.",
    };
  }

  if (numberedVolume && Number(numberedVolume[2]) !== 1) {
    return {
      supported: false,
      errorCode: "follow-up-volume",
      message: `This is a follow-up ${numberedVolume[1].toUpperCase()} volume. Start from the .${numberedVolume[1]}.001 file instead.`,
    };
  }

  if (ZIP_FOLLOW_UP_VOLUME_RE.test(lowerName)) {
    return {
      supported: false,
      errorCode: "follow-up-volume",
      message: "This is a follow-up ZIP volume. Start from the matching .zip file instead.",
    };
  }

  if (ARCHIVE_EXTS.has(ext) || (numberedVolume && Number(numberedVolume[2]) === 1)) {
    return { supported: true };
  }

  return {
    supported: false,
    errorCode: "unsupported-package",
    message: "This package type is not supported by the extraction assistant yet.",
  };
}

function getDiscImagePrepareSupport(filePath) {
  const ext = getExt(path.basename(filePath || "").toLowerCase());
  if (DISC_IMAGE_EXTS.has(ext)) return { supported: true, kind: "disc-image" };
  return {
    supported: false,
    errorCode: "unsupported-image",
    message: "This disc image type is not supported by the preparation assistant yet.",
  };
}

function getPackagePrepareSupport(filePath) {
  const archiveSupport = getArchivePrepareSupport(filePath);
  if (archiveSupport.supported) return { ...archiveSupport, kind: "archive" };
  const discSupport = getDiscImagePrepareSupport(filePath);
  if (discSupport.supported) return discSupport;
  return archiveSupport.errorCode === "follow-up-volume" ? archiveSupport : discSupport;
}

function isPrepareSupportedArchive(filePath) {
  return getArchivePrepareSupport(filePath).supported;
}

function isPrepareSupportedPackage(filePath) {
  return getPackagePrepareSupport(filePath).supported;
}

async function prepareDiscImagePackage({
  packagePath,
  outputDirectory,
  onProgress = () => {},
  spawnImpl = spawn,
  statImpl = fs.stat,
  mkdirImpl = fs.mkdir,
  platform = process.platform,
  mountIsoImpl = mountIsoImage,
} = {}) {
  const normalizedPackagePath = path.resolve(packagePath || "");
  const normalizedOutputDirectory = path.resolve(outputDirectory || "");
  const support = getDiscImagePrepareSupport(normalizedPackagePath);

  if (!support.supported) {
    return { ok: false, errorCode: support.errorCode, message: support.message };
  }

  try {
    const stat = await statImpl(normalizedPackagePath);
    if (!stat.isFile()) return { ok: false, errorCode: "not-file", message: "Disc image path is not a file." };
  } catch {
    return { ok: false, errorCode: "not-found", message: "Disc image file was not found." };
  }

  const ext = getExt(path.basename(normalizedPackagePath));
  onProgress({ phase: "preparing-image", packageName: path.basename(normalizedPackagePath), scanned: 0 });

  if (platform === "win32" && ext === "iso") {
    const mounted = await mountIsoImpl(normalizedPackagePath, spawnImpl);
    if (mounted.ok) {
      return {
        ok: true,
        packagePath: normalizedPackagePath,
        scanPath: mounted.mountPath,
        mounted: true,
        tool: mounted.tool,
      };
    }
  }

  await mkdirImpl(normalizedOutputDirectory, { recursive: true });
  const extracted = await runSevenZipExtract({
    packagePath: normalizedPackagePath,
    outputDirectory: normalizedOutputDirectory,
    password: "",
    spawnImpl,
  });

  if (extracted.ok) {
    return {
      ok: true,
      packagePath: normalizedPackagePath,
      outputDirectory: normalizedOutputDirectory,
      scanPath: normalizedOutputDirectory,
      imageExtracted: true,
      tool: extracted.tool,
    };
  }

  if (extracted.errorCode === "tool-missing") return extracted;
  return {
    ok: false,
    errorCode: "image-prepare-failed",
    message: "This disc image could not be mounted or extracted automatically.",
  };
}

async function runSevenZipExtract({ packagePath, outputDirectory, password, spawnImpl }) {
  const candidates = getSevenZipCandidates();
  for (const command of candidates) {
    const result = await runSevenZipCommand({
      command,
      packagePath,
      outputDirectory,
      password,
      spawnImpl,
    });
    if (result.error?.code === "ENOENT") continue;
    return normalizeExtractionResult(result);
  }

  return {
    ok: false,
    errorCode: "tool-missing",
    message: "A bundled or local 7z-compatible command is required to prepare this package.",
  };
}

function runSevenZipCommand({ command, packagePath, outputDirectory, password, spawnImpl }) {
  return new Promise((resolve) => {
    const args = ["x", "-y", "-aos", `-o${outputDirectory}`];
    if (password) args.push(`-p${password}`);
    args.push("--", packagePath);

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

    const child = spawnImpl(command, args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    timer = setTimeout(() => {
      child.kill?.();
      finish({ timedOut: true });
    }, EXTRACTION_TIMEOUT_MS);

    child.stdout?.on("data", (chunk) => {
      const text = chunk.toString("utf8");
      if (stdout.length + text.length > MAX_OUTPUT_BYTES) {
        truncated = true;
        stdout += text.slice(0, Math.max(0, MAX_OUTPUT_BYTES - stdout.length));
      } else {
        stdout += text;
      }
    });
    child.stderr?.on("data", (chunk) => {
      const text = chunk.toString("utf8");
      if (stderr.length + text.length > MAX_OUTPUT_BYTES) {
        truncated = true;
        stderr += text.slice(0, Math.max(0, MAX_OUTPUT_BYTES - stderr.length));
      } else {
        stderr += text;
      }
    });
    child.on("error", (error) => finish({ error }));
    child.on("close", (code) => finish({ code }));
  });
}

function normalizeExtractionResult(result) {
  if (result.timedOut) {
    return { ok: false, errorCode: "timeout", message: "Package extraction timed out." };
  }
  if (result.error) {
    return {
      ok: false,
      errorCode: "extract-failed",
      message: result.error.message || "Package extraction failed.",
    };
  }
  if (result.code === 0) {
    return { ok: true, tool: result.command };
  }

  const combined = `${result.stdout || ""}\n${result.stderr || ""}`;
  if (isPasswordProblem(combined)) {
    return {
      ok: false,
      errorCode: /wrong password|incorrect password|密码错误|password is incorrect/i.test(combined)
        ? "password-failed"
        : "password-required",
      message: "This package needs the correct extraction password.",
    };
  }
  if (/unexpected end|data error|crc failed|headers error|文件损坏|损坏|corrupt/i.test(combined)) {
    return { ok: false, errorCode: "damaged-package", message: "The package may be damaged or incomplete." };
  }
  if (/cannot find archive|missing volume|volume is absent|分卷/i.test(combined)) {
    return { ok: false, errorCode: "missing-volume", message: "A split archive volume appears to be missing." };
  }

  return {
    ok: false,
    errorCode: "extract-failed",
    message: "Package extraction failed.",
  };
}

function isPasswordProblem(value) {
  return /password|encrypted|wrong password|incorrect password|enter password|can not open encrypted archive|密码/i.test(value || "");
}

async function expandNestedTarIfNeeded({ packagePath, outputDirectory, spawnImpl, statImpl }) {
  const nestedTarName = getNestedTarName(packagePath);
  if (!nestedTarName) return { ok: true };

  const nestedTarPath = path.join(outputDirectory, nestedTarName);
  try {
    const stat = await statImpl(nestedTarPath);
    if (!stat.isFile()) return { ok: true };
  } catch {
    return { ok: true };
  }

  const result = await runSevenZipExtract({
    packagePath: nestedTarPath,
    outputDirectory,
    password: "",
    spawnImpl,
  });

  if (result.ok) {
    return {
      ok: true,
      nestedArchive: nestedTarName,
      tool: result.tool,
    };
  }

  return {
    ok: false,
    errorCode: "nested-archive-failed",
    message: "The compressed tar was unpacked, but its inner tar archive could not be extracted.",
  };
}

function getNestedTarName(filePath) {
  const name = path.basename(filePath || "");
  const rules = [
    [/\.tar\.gz$/i, ".tar"],
    [/\.tgz$/i, ".tar"],
    [/\.tar\.bz2$/i, ".tar"],
    [/\.tbz2?$/i, ".tar"],
    [/\.tar\.xz$/i, ".tar"],
    [/\.txz$/i, ".tar"],
    [/\.tar\.lzma$/i, ".tar"],
    [/\.tlz$/i, ".tar"],
    [/\.tar\.zst$/i, ".tar"],
    [/\.tzst$/i, ".tar"],
  ];
  for (const [pattern, replacement] of rules) {
    if (pattern.test(name)) return name.replace(pattern, replacement);
  }
  return "";
}

function getSevenZipCandidates() {
  return [...new Set([process.env.GALAID_7Z_PATH, getBundledSevenZipPath(), "7zz", "7z", "7za"].filter(Boolean))];
}

function getBundledSevenZipPath() {
  try {
    const { path7za } = require("7zip-bin");
    return unpackAsarPath(path7za);
  } catch {
    return "";
  }
}

function unpackAsarPath(value) {
  return String(value || "").replace(`${path.sep}app.asar${path.sep}`, `${path.sep}app.asar.unpacked${path.sep}`);
}

function mountIsoImage(isoPath, spawnImpl = spawn) {
  return new Promise((resolve) => {
    const command = [
      "$ErrorActionPreference='Stop';",
      `$image=Mount-DiskImage -ImagePath '${escapePowerShellSingleQuoted(isoPath)}' -PassThru;`,
      "Start-Sleep -Milliseconds 500;",
      "$volume=$image | Get-Volume | Select-Object -First 1;",
      "if ($volume -and $volume.DriveLetter) { Write-Output ($volume.DriveLetter + ':\\') } else { exit 3 }",
    ].join(" ");
    let stdout = "";
    let stderr = "";
    let settled = false;
    let timer;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve(result);
    };

    const child = spawnImpl("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command], {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    timer = setTimeout(() => {
      child.kill?.();
      finish({ ok: false, errorCode: "mount-timeout" });
    }, ISO_MOUNT_TIMEOUT_MS);

    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", (error) => finish({ ok: false, errorCode: error.code === "ENOENT" ? "mount-unavailable" : "mount-failed", message: error.message }));
    child.on("close", (code) => {
      const match = stdout.match(/[A-Z]:\\/i);
      if (code === 0 && match) {
        finish({ ok: true, mountPath: match[0], tool: "Windows Mount-DiskImage" });
      } else {
        finish({ ok: false, errorCode: "mount-failed", message: stderr.trim() || "Could not mount the ISO image." });
      }
    });
  });
}

function unmountIsoImage(isoPath, spawnImpl = spawn) {
  return new Promise((resolve) => {
    const command = [
      "$ErrorActionPreference='Stop';",
      `Dismount-DiskImage -ImagePath '${escapePowerShellSingleQuoted(isoPath)}';`,
      "Write-Output 'OK';",
    ].join(" ");
    let stderr = "";
    let settled = false;
    let timer;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve(result);
    };

    const child = spawnImpl("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command], {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    timer = setTimeout(() => {
      child.kill?.();
      finish({ ok: false, errorCode: "unmount-timeout" });
    }, ISO_MOUNT_TIMEOUT_MS);

    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", (error) => finish({ ok: false, errorCode: error.code === "ENOENT" ? "unmount-unavailable" : "unmount-failed", message: error.message }));
    child.on("close", (code) => {
      if (code === 0) {
        finish({ ok: true, tool: "Windows Dismount-DiskImage" });
      } else {
        finish({ ok: false, errorCode: "unmount-failed", message: stderr.trim() || "Could not unmount the ISO image." });
      }
    });
  });
}

function escapePowerShellSingleQuoted(value) {
  return String(value || "").replaceAll("'", "''");
}

function getExt(name) {
  const index = String(name || "").lastIndexOf(".");
  return index >= 0 ? name.slice(index + 1).toLowerCase() : "";
}

module.exports = {
  getBundledSevenZipPath,
  getArchivePrepareSupport,
  getDiscImagePrepareSupport,
  getPackagePrepareSupport,
  isPrepareSupportedArchive,
  isPrepareSupportedPackage,
  mountIsoImage,
  prepareArchivePackage,
  prepareDiscImagePackage,
  prepareLocalPackage,
  unmountIsoImage,
};
