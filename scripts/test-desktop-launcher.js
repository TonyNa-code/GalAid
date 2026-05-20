const assert = require("node:assert/strict");
const path = require("node:path");
const {
  buildLaunchAllowlist,
  createShortcutForAllowedEntry,
  isWindowsLaunchablePath,
  launchAllowedEntry,
  normalizeShortcutPath,
} = require("../desktop/launcher");

async function main() {
  const gamePath = path.resolve("GameRoot", "Game.exe");
  const shortcutPath = path.resolve("GameRoot", "Play.lnk");
  const msiPath = path.resolve("GameRoot", "Installer.msi");
  const setupPath = path.resolve("GameRoot", "setup.bat");
  const allowlist = buildLaunchAllowlist([
    { fullPath: gamePath, path: "GameRoot/Game.exe" },
    { fullPath: shortcutPath, path: "GameRoot/Play.lnk" },
    { fullPath: msiPath, path: "GameRoot/Installer.msi" },
    { fullPath: setupPath, path: "GameRoot/setup.bat" },
  ]);

  assert.equal(isWindowsLaunchablePath(gamePath), true);
  assert.equal(isWindowsLaunchablePath(shortcutPath), true);
  assert.equal(isWindowsLaunchablePath(msiPath), true);
  assert.equal(isWindowsLaunchablePath(setupPath), false);
  assert.equal(allowlist.has(gamePath), true);
  assert.equal(allowlist.has(shortcutPath), true);
  assert.equal(allowlist.has(msiPath), true);
  assert.equal(allowlist.has(setupPath), false);

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
  assert.equal(spawned.length, 2);
  assert.equal(spawned[1].command, "cmd.exe");
  assert.deepEqual(spawned[1].args, ["/d", "/s", "/c", "start", "", shortcutPath]);
  assert.equal(spawned[1].options.cwd, path.dirname(shortcutPath));

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
  assert.equal(spawned.length, 3);
  assert.equal(spawned[2].command, "msiexec.exe");
  assert.deepEqual(spawned[2].args, ["/i", msiPath]);
  assert.equal(spawned[2].options.cwd, path.dirname(msiPath));

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
