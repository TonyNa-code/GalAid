const fs = require("node:fs/promises");
const path = require("node:path");
const { spawn } = require("node:child_process");

const WINDOWS_LAUNCH_EXTS = new Set(["exe", "com"]);

function buildLaunchAllowlist(files) {
  const allowlist = new Map();

  for (const file of files || []) {
    if (!file?.fullPath || !isWindowsLaunchablePath(file.fullPath)) continue;
    const entryFullPath = path.resolve(file.fullPath);
    allowlist.set(entryFullPath, {
      entryFullPath,
      entryName: path.basename(entryFullPath),
      workingDirectoryFull: path.dirname(entryFullPath),
      relativePath: file.path || path.basename(entryFullPath),
    });
  }

  return allowlist;
}

function isWindowsLaunchablePath(filePath) {
  const ext = path.extname(String(filePath || "")).replace(/^\./, "").toLowerCase();
  return WINDOWS_LAUNCH_EXTS.has(ext);
}

async function launchAllowedEntry({
  allowlist,
  entryFullPath,
  platform = process.platform,
  spawnImpl = spawn,
  statImpl = fs.stat,
} = {}) {
  if (platform !== "win32") {
    return { ok: false, errorCode: "unsupported-platform" };
  }

  const requestedPath = entryFullPath ? path.resolve(entryFullPath) : "";
  const entry = allowlist?.get(requestedPath);
  if (!entry) {
    return { ok: false, errorCode: "not-allowed" };
  }

  if (!isWindowsLaunchablePath(entry.entryFullPath)) {
    return { ok: false, errorCode: "unsupported-entry" };
  }

  const stat = await statImpl(entry.entryFullPath);
  if (!stat?.isFile?.()) {
    return { ok: false, errorCode: "not-a-file" };
  }

  const child = spawnImpl(entry.entryFullPath, [], {
    cwd: entry.workingDirectoryFull,
    detached: true,
    stdio: "ignore",
    windowsHide: false,
  });
  child?.unref?.();

  return {
    ok: true,
    pid: child?.pid || null,
    entryName: entry.entryName,
    relativePath: entry.relativePath,
    workingDirectory: entry.workingDirectoryFull,
  };
}

module.exports = {
  WINDOWS_LAUNCH_EXTS,
  buildLaunchAllowlist,
  isWindowsLaunchablePath,
  launchAllowedEntry,
};
