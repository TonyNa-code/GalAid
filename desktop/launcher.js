const fs = require("node:fs/promises");
const path = require("node:path");
const { spawn } = require("node:child_process");

const WINDOWS_LAUNCH_EXTS = new Set(["exe", "com", "msi"]);
const SHORTCUT_EXT = ".lnk";

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
  const resolved = await resolveAllowedLaunchEntry({ allowlist, entryFullPath, platform, statImpl });
  if (!resolved.ok) return resolved;
  const { entry } = resolved;
  const launch = getLaunchCommand(entry);

  const child = spawnImpl(launch.command, launch.args, {
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
    entryFullPath: entry.entryFullPath,
    workingDirectory: entry.workingDirectoryFull,
  };
}

async function createShortcutForAllowedEntry({
  allowlist,
  entryFullPath,
  shortcutPath,
  platform = process.platform,
  statImpl = fs.stat,
  writeShortcutLinkImpl,
} = {}) {
  const resolved = await resolveAllowedLaunchEntry({ allowlist, entryFullPath, platform, statImpl });
  if (!resolved.ok) return resolved;
  if (typeof writeShortcutLinkImpl !== "function") return { ok: false, errorCode: "shortcut-unavailable" };

  const normalizedShortcutPath = normalizeShortcutPath(shortcutPath);
  if (!normalizedShortcutPath) return { ok: false, errorCode: "invalid-shortcut-path" };

  const { entry } = resolved;
  const created = writeShortcutLinkImpl(normalizedShortcutPath, {
    target: entry.entryFullPath,
    cwd: entry.workingDirectoryFull,
    description: `Launch ${entry.entryName} with GalAid`,
    icon: entry.entryFullPath,
    iconIndex: 0,
  });

  if (!created) return { ok: false, errorCode: "shortcut-failed" };

  return {
    ok: true,
    shortcutPath: normalizedShortcutPath,
    shortcutName: path.basename(normalizedShortcutPath),
    entryName: entry.entryName,
    relativePath: entry.relativePath,
  };
}

async function resolveAllowedLaunchEntry({ allowlist, entryFullPath, platform = process.platform, statImpl = fs.stat } = {}) {
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

  return { ok: true, entry };
}

function getLaunchCommand(entry) {
  if (path.extname(entry.entryFullPath).toLowerCase() === ".msi") {
    return {
      command: "msiexec.exe",
      args: ["/i", entry.entryFullPath],
    };
  }
  return {
    command: entry.entryFullPath,
    args: [],
  };
}

function normalizeShortcutPath(shortcutPath) {
  if (!shortcutPath) return "";
  const resolved = path.resolve(shortcutPath);
  return path.extname(resolved).toLowerCase() === SHORTCUT_EXT ? resolved : `${resolved}${SHORTCUT_EXT}`;
}

module.exports = {
  WINDOWS_LAUNCH_EXTS,
  buildLaunchAllowlist,
  createShortcutForAllowedEntry,
  getLaunchCommand,
  isWindowsLaunchablePath,
  launchAllowedEntry,
  normalizeShortcutPath,
  resolveAllowedLaunchEntry,
};
