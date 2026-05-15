const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const {
  getBundledSevenZipPath,
  getArchivePrepareSupport,
  getDiscImagePrepareSupport,
  isPrepareSupportedArchive,
  isPrepareSupportedPackage,
  mountIsoImage,
  prepareArchivePackage,
  prepareDiscImagePackage,
  prepareLocalPackage,
  unmountIsoImage,
} = require("../desktop/package-prep");

async function main() {
  assert.ok(getBundledSevenZipPath().includes("7zip-bin"));
  assert.equal(isPrepareSupportedArchive("Game.zip"), true);
  assert.equal(isPrepareSupportedArchive("Game.7z.001"), true);
  assert.equal(isPrepareSupportedArchive("Game.part1.rar"), true);
  assert.equal(isPrepareSupportedArchive("Game.part2.rar"), false);
  assert.equal(getArchivePrepareSupport("Disc.iso").errorCode, "unsupported-package");
  assert.equal(getDiscImagePrepareSupport("Disc.iso").kind, "disc-image");
  assert.equal(isPrepareSupportedPackage("Disc.iso"), true);

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "galaid-package-prep-"));
  const archivePath = path.join(tempDir, "MoonlightCafe.part1.rar");
  const isoPath = path.join(tempDir, "MoonlightCafe.iso");
  const outputDirectory = path.join(tempDir, "MoonlightCafe-prepared");
  const imageOutputDirectory = path.join(tempDir, "MoonlightCafe-image-prepared");
  const knownPassword = "known-" + "password";
  const badPassword = "bad-" + "password";
  await fs.writeFile(archivePath, "fixture");
  await fs.writeFile(isoPath, "fixture");

  const spawned = [];
  const success = await prepareArchivePackage({
    packagePath: archivePath,
    outputDirectory,
    password: knownPassword,
    spawnImpl: makeSpawn({ spawned, stdout: "Everything is Ok", code: 0 }),
  });
  assert.equal(success.ok, true);
  assert.equal(success.outputDirectory, outputDirectory);
  assert.equal(success.passwordUsed, true);
  assert.equal(JSON.stringify(success).includes(knownPassword), false);
  assert.equal(spawned.length, 1);
  assert.ok(spawned[0].args.includes("x"));
  assert.ok(spawned[0].args.includes(`-o${outputDirectory}`));
  assert.ok(spawned[0].args.includes(`-p${knownPassword}`));
  assert.equal(spawned[0].args.at(-1), archivePath);

  const wrongPassword = await prepareArchivePackage({
    packagePath: archivePath,
    outputDirectory,
    password: badPassword,
    spawnImpl: makeSpawn({ stderr: "ERROR: Wrong password", code: 2 }),
  });
  assert.equal(wrongPassword.ok, false);
  assert.equal(wrongPassword.errorCode, "password-failed");
  assert.equal(JSON.stringify(wrongPassword).includes(badPassword), false);

  const missingTool = await prepareArchivePackage({
    packagePath: archivePath,
    outputDirectory,
    spawnImpl: makeSpawn({ error: Object.assign(new Error("missing"), { code: "ENOENT" }) }),
  });
  assert.equal(missingTool.ok, false);
  assert.equal(missingTool.errorCode, "tool-missing");

  const extractedImage = await prepareDiscImagePackage({
    packagePath: isoPath,
    outputDirectory: imageOutputDirectory,
    platform: "darwin",
    spawnImpl: makeSpawn({ stdout: "Everything is Ok", code: 0 }),
  });
  assert.equal(extractedImage.ok, true);
  assert.equal(extractedImage.imageExtracted, true);
  assert.equal(extractedImage.scanPath, imageOutputDirectory);

  const mountedImage = await prepareDiscImagePackage({
    packagePath: isoPath,
    outputDirectory: imageOutputDirectory,
    platform: "win32",
    mountIsoImpl: async () => ({ ok: true, mountPath: "R:\\", tool: "Windows Mount-DiskImage" }),
    spawnImpl: makeSpawn({ error: new Error("should not extract mounted image") }),
  });
  assert.equal(mountedImage.ok, true);
  assert.equal(mountedImage.mounted, true);
  assert.equal(mountedImage.scanPath, "R:\\");

  const mountSpawned = [];
  const mountedViaCommand = await mountIsoImage("C:\\VN Disc's\\MoonlightCafe.iso", makeSpawn({ spawned: mountSpawned, stdout: "R:\\\n", code: 0 }));
  assert.equal(mountedViaCommand.ok, true);
  assert.equal(mountedViaCommand.mountPath, "R:\\");
  assert.equal(mountSpawned[0].command, "powershell.exe");
  assert.match(mountSpawned[0].args.at(-1), /Mount-DiskImage/);
  assert.match(mountSpawned[0].args.at(-1), /VN Disc''s/);

  const unmountSpawned = [];
  const unmountedViaCommand = await unmountIsoImage("C:\\VN Disc's\\MoonlightCafe.iso", makeSpawn({ spawned: unmountSpawned, stdout: "OK\n", code: 0 }));
  assert.equal(unmountedViaCommand.ok, true);
  assert.equal(unmountedViaCommand.tool, "Windows Dismount-DiskImage");
  assert.equal(unmountSpawned[0].command, "powershell.exe");
  assert.match(unmountSpawned[0].args.at(-1), /Dismount-DiskImage/);
  assert.match(unmountSpawned[0].args.at(-1), /VN Disc''s/);

  const generic = await prepareLocalPackage({
    packagePath: isoPath,
    outputDirectory: imageOutputDirectory,
    platform: "darwin",
    spawnImpl: makeSpawn({ stdout: "Everything is Ok", code: 0 }),
  });
  assert.equal(generic.ok, true);

  await fs.rm(tempDir, { recursive: true, force: true });
  console.log("Package prep smoke passed.");
}

function makeSpawn({ spawned = [], stdout = "", stderr = "", code = 0, error = null } = {}) {
  return (command, args, options) => {
    spawned.push({ command, args, options });
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.kill = () => {};
    process.nextTick(() => {
      if (error) {
        child.emit("error", error);
        return;
      }
      if (stdout) child.stdout.emit("data", Buffer.from(stdout));
      if (stderr) child.stderr.emit("data", Buffer.from(stderr));
      child.emit("close", code);
    });
    return child;
  };
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
