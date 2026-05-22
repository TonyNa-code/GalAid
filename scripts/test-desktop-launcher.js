const assert = require("node:assert/strict");
const path = require("node:path");
const {
  buildLaunchAllowlist,
  createShortcutForAllowedEntry,
  isAllowedScannedLaunchFile,
  isWindowsLaunchablePath,
  launchAllowedEntry,
  normalizeShortcutPath,
} = require("../desktop/launcher");

async function main() {
  const gamePath = path.resolve("GameRoot", "Game.exe");
  const scriptPath = path.resolve("GameRoot", "Start.bat");
  const commandPath = path.resolve("GameRoot", "Run.cmd");
  const shortcutPath = path.resolve("GameRoot", "Play.lnk");
  const msiPath = path.resolve("GameRoot", "Installer.msi");
  const setupPath = path.resolve("GameRoot", "setup.bat");
  const autorunSetupPath = path.resolve("GameRoot", "Setup.cmd");
  const allowlist = buildLaunchAllowlist([
    { fullPath: gamePath, path: "GameRoot/Game.exe" },
    { fullPath: scriptPath, path: "GameRoot/Start.bat", lowerPath: "gameroot/start.bat" },
    { fullPath: commandPath, path: "GameRoot/Run.cmd", lowerPath: "gameroot/run.cmd" },
    { fullPath: shortcutPath, path: "GameRoot/Play.lnk" },
    { fullPath: msiPath, path: "GameRoot/Installer.msi" },
    { fullPath: setupPath, path: "GameRoot/setup.bat", lowerPath: "gameroot/setup.bat" },
    { fullPath: autorunSetupPath, path: "GameRoot/Setup.cmd", lowerPath: "gameroot/setup.cmd" },
    {
      fullPath: path.resolve("GameRoot", "autorun.inf"),
      path: "GameRoot/autorun.inf",
      lowerPath: "gameroot/autorun.inf",
      textPreview: "[autorun]\nopen=Setup.cmd /install\n",
    },
  ]);

  assert.equal(isWindowsLaunchablePath(gamePath), true);
  assert.equal(isWindowsLaunchablePath(scriptPath), true);
  assert.equal(isWindowsLaunchablePath(commandPath), true);
  assert.equal(isWindowsLaunchablePath(shortcutPath), true);
  assert.equal(isWindowsLaunchablePath(msiPath), true);
  assert.equal(isWindowsLaunchablePath(setupPath), true);
  assert.equal(isAllowedScannedLaunchFile({ fullPath: scriptPath, path: "GameRoot/Start.bat" }), true);
  assert.equal(isAllowedScannedLaunchFile({ fullPath: setupPath, path: "GameRoot/setup.bat" }), false);
  assert.equal(allowlist.has(gamePath), true);
  assert.equal(allowlist.has(scriptPath), true);
  assert.equal(allowlist.has(commandPath), true);
  assert.equal(allowlist.has(shortcutPath), true);
  assert.equal(allowlist.has(msiPath), true);
  assert.equal(allowlist.has(setupPath), false);
  assert.equal(allowlist.has(autorunSetupPath), true);

  const spawned = [];
  const result = await launchAllowedEntry({
    allowlist,
    entryFullPath: gamePath,
    platform: "win32",
    statImpl: async () => ({ isFile: () => true }),
    spawnImpl: (command, args, options) => {
      spawned.push({ command, args, options });
      return { pid: 1234, unref() {} };
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.pid, 1234);
  assert.equal(result.entryName, "Game.exe");
  assert.equal(spawned.length, 1);
  assert.equal(spawned[0].command, gamePath);
  assert.deepEqual(spawned[0].args, []);
  assert.equal(spawned[0].options.cwd, path.dirname(gamePath));
  assert.equal(spawned[0].options.detached, true);

  const scriptLaunchResult = await launchAllowedEntry({
    allowlist,
    entryFullPath: scriptPath,
    platform: "win32",
    statImpl: async () => ({ isFile: () => true }),
    spawnImpl: (command, args, options) => {
      spawned.push({ command, args, options });
      return { pid: 2134, unref() {} };
    },
  });

  assert.equal(scriptLaunchResult.ok, true);
  assert.equal(scriptLaunchResult.entryName, "Start.bat");
  assert.equal(spawned.length, 2);
  assert.equal(spawned[1].command, "cmd.exe");
  assert.deepEqual(spawned[1].args, ["/d", "/s", "/c", "call", scriptPath]);
  assert.equal(spawned[1].options.cwd, path.dirname(scriptPath));

  const commandLaunchResult = await launchAllowedEntry({
    allowlist,
    entryFullPath: commandPath,
    platform: "win32",
    statImpl: async () => ({ isFile: () => true }),
    spawnImpl: (command, args, options) => {
      spawned.push({ command, args, options });
      return { pid: 2135, unref() {} };
    },
  });

  assert.equal(commandLaunchResult.ok, true);
  assert.equal(commandLaunchResult.entryName, "Run.cmd");
  assert.equal(spawned.length, 3);
  assert.equal(spawned[2].command, "cmd.exe");
  assert.deepEqual(spawned[2].args, ["/d", "/s", "/c", "call", commandPath]);
  assert.equal(spawned[2].options.cwd, path.dirname(commandPath));

  const autorunSetupResult = await launchAllowedEntry({
    allowlist,
    entryFullPath: autorunSetupPath,
    platform: "win32",
    statImpl: async () => ({ isFile: () => true }),
    spawnImpl: (command, args, options) => {
      spawned.push({ command, args, options });
      return { pid: 2136, unref() {} };
    },
  });

  assert.equal(autorunSetupResult.ok, true);
  assert.equal(autorunSetupResult.entryName, "Setup.cmd");
  assert.equal(spawned.length, 4);
  assert.equal(spawned[3].command, "cmd.exe");
  assert.deepEqual(spawned[3].args, ["/d", "/s", "/c", "call", autorunSetupPath]);
  assert.equal(spawned[3].options.cwd, path.dirname(autorunSetupPath));

  const shortcutLaunchResult = await launchAllowedEntry({
    allowlist,
    entryFullPath: shortcutPath,
    platform: "win32",
    statImpl: async () => ({ isFile: () => true }),
    spawnImpl: (command, args, options) => {
      spawned.push({ command, args, options });
      return { pid: 2234, unref() {} };
    },
  });

  assert.equal(shortcutLaunchResult.ok, true);
  assert.equal(shortcutLaunchResult.entryName, "Play.lnk");
  assert.equal(spawned.length, 5);
  assert.equal(spawned[4].command, "cmd.exe");
  assert.deepEqual(spawned[4].args, ["/d", "/s", "/c", "start", "", shortcutPath]);
  assert.equal(spawned[4].options.cwd, path.dirname(shortcutPath));

  const msiResult = await launchAllowedEntry({
    allowlist,
    entryFullPath: msiPath,
    platform: "win32",
    statImpl: async () => ({ isFile: () => true }),
    spawnImpl: (command, args, options) => {
      spawned.push({ command, args, options });
      return { pid: 2345, unref() {} };
    },
  });

  assert.equal(msiResult.ok, true);
  assert.equal(msiResult.entryName, "Installer.msi");
  assert.equal(spawned.length, 6);
  assert.equal(spawned[5].command, "msiexec.exe");
  assert.deepEqual(spawned[5].args, ["/i", msiPath]);
  assert.equal(spawned[5].options.cwd, path.dirname(msiPath));

  const rejected = await launchAllowedEntry({
    allowlist,
    entryFullPath: path.resolve("Other", "Game.exe"),
    platform: "win32",
    statImpl: async () => ({ isFile: () => true }),
    spawnImpl: () => {
      throw new Error("spawn should not run for rejected paths");
    },
  });
  assert.deepEqual(rejected, { ok: false, errorCode: "not-allowed" });

  const unsupported = await launchAllowedEntry({
    allowlist,
    entryFullPath: gamePath,
    platform: "darwin",
  });
  assert.deepEqual(unsupported, { ok: false, errorCode: "unsupported-platform" });

  const shortcuts = [];
  const shortcutResult = await createShortcutForAllowedEntry({
    allowlist,
    entryFullPath: gamePath,
    shortcutPath: path.resolve("Desktop", "Game"),
    platform: "win32",
    statImpl: async () => ({ isFile: () => true }),
    writeShortcutLinkImpl: (shortcutPath, options) => {
      shortcuts.push({ shortcutPath, options });
      return true;
    },
  });

  assert.equal(shortcutResult.ok, true);
  assert.equal(shortcutResult.shortcutName, "Game.lnk");
  assert.equal(shortcuts.length, 1);
  assert.equal(shortcuts[0].shortcutPath, normalizeShortcutPath(path.resolve("Desktop", "Game")));
  assert.equal(shortcuts[0].options.target, gamePath);
  assert.equal(shortcuts[0].options.cwd, path.dirname(gamePath));

  const rejectedShortcut = await createShortcutForAllowedEntry({
    allowlist,
    entryFullPath: path.resolve("Other", "Game.exe"),
    shortcutPath: path.resolve("Desktop", "Other.lnk"),
    platform: "win32",
    statImpl: async () => ({ isFile: () => true }),
    writeShortcutLinkImpl: () => {
      throw new Error("shortcut should not be created for rejected paths");
    },
  });
  assert.deepEqual(rejectedShortcut, { ok: false, errorCode: "not-allowed" });

  console.log("Desktop launcher smoke passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
