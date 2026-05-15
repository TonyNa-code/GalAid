const assert = require("node:assert/strict");
const path = require("node:path");
const {
  buildLaunchAllowlist,
  isWindowsLaunchablePath,
  launchAllowedEntry,
} = require("../desktop/launcher");

async function main() {
  const gamePath = path.resolve("GameRoot", "Game.exe");
  const setupPath = path.resolve("GameRoot", "setup.bat");
  const allowlist = buildLaunchAllowlist([
    { fullPath: gamePath, path: "GameRoot/Game.exe" },
    { fullPath: setupPath, path: "GameRoot/setup.bat" },
  ]);

  assert.equal(isWindowsLaunchablePath(gamePath), true);
  assert.equal(isWindowsLaunchablePath(setupPath), false);
  assert.equal(allowlist.has(gamePath), true);
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

  console.log("Desktop launcher smoke passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
