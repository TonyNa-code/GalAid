const fs = require("node:fs/promises");
const path = require("node:path");
const { spawn } = require("node:child_process");

const WINDOWS_LAUNCH_EXTS = new Set(["exe", "com", "bat", "cmd", "lnk", "msi"]);
const WINDOWS_SCRIPT_EXTS = new Set(["bat", "cmd"]);
const SHORTCUT_EXT = ".lnk";

function buildLaunchAllowlist(files) {
  const allowlist = new Map();
  const autorunTargetPaths = getAutorunTargetPaths(files);

  for (const file of files || []) {
    if (!isAllowedScannedLaunchFile(file, { autorunTargetPaths })) continue;
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

function isAllowedScannedLaunchFile(file, context = {}) {
  if (!file?.fullPath || !isWindowsLaunchablePath(file.fullPath)) return false;
  const ext = path.extname(String(file.fullPath || "")).replace(/^\./, "").toLowerCase();
  if (!WINDOWS_SCRIPT_EXTS.has(ext)) return true;
  if (isAutorunTargetFile(file, context.autorunTargetPaths)) return true;
  return !isInstallerOrToolScript(file);
}

function isInstallerOrToolScript(file) {
  const lowerPath = String(file.lowerPath || file.path || file.fullPath || "").toLowerCase();
  const base = path.basename(String(file.fullPath || file.name || "")).toLowerCase();
  return (
    /(^|[\\/])(setup|install|installer|redist|support|patch|update|unins|uninstall)([._ -]|$)/i.test(lowerPath) ||
    /^(setup|install|installer|redist|patch|update|unins|uninstall)[\w .-]*\.(bat|cmd)$/i.test(base) ||
    /(dxsetup|dxwebsetup|vcredist|vc_redist|dotnet|config|setting|option|keygen|crack|serial|no.?dvd|no.?cd|免dvd|免cd)/i.test(lowerPath)
  );
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
  const ext = path.extname(entry.entryFullPath).toLowerCase();
  if (ext === ".lnk") {
    return {
      command: "cmd.exe",
      args: ["/d", "/s", "/c", "start", "", entry.entryFullPath],
    };
  }
  if (ext === ".bat" || ext === ".cmd") {
    return {
      command: "cmd.exe",
      args: ["/d", "/s", "/c", "call", entry.entryFullPath],
    };
  }
  if (ext === ".msi") {
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

function getAutorunTargetPaths(files) {
  const targets = new Set();
  for (const file of files || []) {
    const fileName = String(file?.name || path.basename(file?.path || file?.fullPath || "")).toLowerCase();
    if (fileName !== "autorun.inf") continue;
    const text = typeof file.textPreview === "string" ? file.textPreview : "";
    if (!text) continue;
    const baseDir = getDirectoryName(file.path || "");
    for (const target of parseAutorunTargets(text)) {
      const relative = baseDir && baseDir !== "." ? `${baseDir}/${target}` : target;
      const normalized = normalizeScannedPath(relative);
      if (normalized) targets.add(normalized.toLowerCase());
    }
  }
  return targets;
}

function parseAutorunTargets(text) {
  const targets = [];
  let sawSection = false;
  let inAutorunSection = false;

  for (const rawLine of String(text || "").split(/\r?\n/)) {
    const line = rawLine.trim().replace(/^\uFEFF/, "");
    if (!line || line.startsWith(";") || line.startsWith("#")) continue;

    const section = line.match(/^\[([^\]]+)\]$/);
    if (section) {
      sawSection = true;
      inAutorunSection = section[1].trim().toLowerCase() === "autorun";
      continue;
    }

    if (sawSection && !inAutorunSection) continue;
    const separator = line.indexOf("=");
    if (separator < 0) continue;

    const key = line.slice(0, separator).trim().toLowerCase();
    if (!isAutorunCommandKey(key)) continue;

    const target = extractAutorunCommandPath(line.slice(separator + 1));
    if (target) targets.push(target);
  }

  return [...new Set(targets)];
}

function isAutorunCommandKey(key) {
  if (["open", "shellexecute", "shell\\open\\command"].includes(key)) return true;
  const match = key.match(/^shell\\([^\\]+)\\command$/);
  if (!match) return false;
  return /^(install|setup|start|run|play)$/i.test(match[1]) || /(install|setup|start|run|play)/i.test(match[1]);
}

function extractAutorunCommandPath(command) {
  let value = stripAutorunInlineComment(String(command || "")).trim();
  if (!value) return "";
  if (value.startsWith("@")) value = value.slice(1).trim();

  let target = "";
  if (value.startsWith('"')) {
    const closeIndex = value.indexOf('"', 1);
    target = closeIndex > 1 ? value.slice(1, closeIndex) : value.slice(1);
  } else {
    target = value.split(/\s+/)[0] || "";
  }

  target = normalizeScannedPath(target.replace(/^file:/i, ""));
  if (!target || /^[a-z]+:/i.test(target) || target.startsWith("//")) return "";
  if (!["exe", "com", "msi", "bat", "cmd"].includes(getExt(target))) return "";
  if (/^(rundll32|cmd|command)\.(exe|com|bat|cmd)$/i.test(path.basename(target))) return "";
  return target;
}

function stripAutorunInlineComment(value) {
  let inQuote = false;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === '"') inQuote = !inQuote;
    if (!inQuote && (char === ";" || char === "#")) return value.slice(0, index);
  }
  return value;
}

function getDirectoryName(filePath) {
  const normalized = normalizeScannedPath(filePath);
  const index = normalized.lastIndexOf("/");
  return index >= 0 ? normalized.slice(0, index) || "." : ".";
}

function normalizeScannedPath(value) {
  return String(value || "")
    .replace(/\\/g, "/")
    .replace(/^(\.\/)+/, "")
    .replace(/^\/+/, "");
}

function isAutorunTargetFile(file, autorunTargetPaths) {
  const relative = String(file?.lowerPath || normalizeScannedPath(file?.path || "")).toLowerCase();
  return Boolean(relative && autorunTargetPaths?.has?.(relative));
}

function getExt(filePath) {
  const base = path.basename(String(filePath || ""));
  const index = base.lastIndexOf(".");
  return index >= 0 ? base.slice(index + 1).toLowerCase() : "";
}

module.exports = {
  WINDOWS_LAUNCH_EXTS,
  buildLaunchAllowlist,
  createShortcutForAllowedEntry,
  getLaunchCommand,
  isAllowedScannedLaunchFile,
  isWindowsLaunchablePath,
  launchAllowedEntry,
  normalizeShortcutPath,
  resolveAllowedLaunchEntry,
};
