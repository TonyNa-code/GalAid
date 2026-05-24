const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { getPreviewKind, parseSevenZipListOutput, previewDiscImageFile, previewZipFile } = require("../desktop/archive-preview");

async function main() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "galaid-zip-preview-"));
  const zipPath = path.join(tempDir, "sample.zip");
  await fs.writeFile(
    zipPath,
    makeZip([
      { name: "SnowTrial/Game.exe", content: "launcher" },
      { name: "SnowTrial/data.xp3", content: "resource" },
      { name: "SnowTrial/scenario/common.ks", content: "script" },
      { name: "SnowTrial/system/Config.tjs", content: "config" },
    ]),
  );

  const preview = await previewZipFile(zipPath);
  assert.equal(preview.status, "ok");
  assert.equal(preview.fileCount, 4);
  assert.equal(preview.signals.launchCandidateCount, 1);
  assert.deepEqual(preview.signals.launchSamples, ["SnowTrial/Game.exe"]);
  assert.equal(preview.signals.engineHints[0].id, "kirikiri");
  assert.ok(preview.signals.engineHints[0].samples.includes("SnowTrial/system/Config.tjs"));
  assert.equal(preview.sampleFiles[1].path, "SnowTrial/data.xp3");
  assert.deepEqual(getPreviewKind("ClassicVN.lzh", "lzh"), { kind: "external-list", format: "LZH" });
  assert.deepEqual(getPreviewKind("ClassicVN.tar.gz", "gz"), { kind: "external-list", format: "TAR.GZ" });
  assert.equal(getPreviewKind("ClassicVN.z01", "z01"), null);
  assert.equal(getPreviewKind("DownloadPackage.exe", "exe"), null);
  assert.deepEqual(getPreviewKind("DownloadPackage.exe", "exe", { allowSelfExtractingExecutable: true }), { kind: "self-extracting-archive", format: "Self-extracting EXE" });

  const rarPreview = parseSevenZipListOutput(
    [
      "Path = sample.rar",
      "Type = Rar",
      "",
      "Path = MoonlightCafe/Game.exe",
      "Size = 1422000",
      "Packed Size = 980000",
      "Encrypted = -",
      "",
      "Path = MoonlightCafe/setup.exe",
      "Size = 2610000",
      "Packed Size = 1800000",
      "Encrypted = -",
      "",
      "Path = MoonlightCafe/data00.arc",
      "Size = 1380000000",
      "Packed Size = 1200000000",
      "Encrypted = -",
      "",
      "Path = MoonlightCafe/script.ypf",
      "Size = 188000000",
      "Packed Size = 160000000",
      "Encrypted = -",
      "",
      "Path = MoonlightCafe/graphics.gxp",
      "Size = 512000000",
      "Packed Size = 410000000",
      "Encrypted = -",
      "",
      "Path = MoonlightCafe/system.dat",
      "Size = 4800000",
      "Packed Size = 2800000",
      "Encrypted = +",
      "",
    ].join("\n"),
    "RAR",
    { warnings: ["Listed with a local 7z-compatible command; no files were extracted."] },
  );
  assert.equal(rarPreview.status, "ok");
  assert.equal(rarPreview.format, "RAR");
  assert.equal(rarPreview.fileCount, 6);
  assert.equal(rarPreview.encryptedEntries, 1);
  assert.deepEqual(rarPreview.signals.launchSamples, ["MoonlightCafe/Game.exe"]);
  assert.deepEqual(rarPreview.signals.installerSamples, ["MoonlightCafe/setup.exe"]);
  assert.equal(rarPreview.signals.assetCounts.commercialArchives, 4);
  assert.equal(rarPreview.signals.engineHints[0].id, "commercial-proprietary");

  const sfxPreview = parseSevenZipListOutput(
    [
      "Path = GalgamePackage.exe",
      "Type = 7z",
      "",
      "Path = GalgamePackage/Game.exe",
      "Size = 1422000",
      "Packed Size = 980000",
      "Encrypted = -",
      "",
      "Path = GalgamePackage/data.xp3",
      "Size = 420000000",
      "Packed Size = 380000000",
      "Encrypted = -",
      "",
    ].join("\n"),
    "Self-extracting EXE",
    {
      packageKind: "self-extracting-archive",
      warnings: ["Self-extracting EXE package detected; prepare it like an archive before launching the extracted game."],
    },
  );
  assert.equal(sfxPreview.status, "ok");
  assert.equal(sfxPreview.packageKind, "self-extracting-archive");
  assert.equal(sfxPreview.signals.launchCandidateCount, 1);
  assert.deepEqual(sfxPreview.signals.launchSamples, ["GalgamePackage/Game.exe"]);

  const isoPath = path.join(tempDir, "MoonlightCafe_Bonus.iso");
  await fs.writeFile(isoPath, Buffer.alloc(32));
  const isoPreview = await previewDiscImageFile(isoPath, "iso", { runExternalListImpl: async () => ({ missing: true }) });
  assert.equal(isoPreview.status, "ok");
  assert.equal(isoPreview.packageKind, "disc-image");
  assert.equal(isoPreview.fileCount, 1);
  assert.match(isoPreview.warnings[0], /metadata only/);

  const listedIsoPreview = await previewDiscImageFile(isoPath, "iso", {
    runExternalListImpl: async () => ({
      code: 0,
      stdout: [
        "Path = MoonlightCafe_Bonus.iso",
        "Type = Iso",
        "",
        "Path = Install/SetupJP.exe",
        "Size = 2412000",
        "Packed Size = 2412000",
        "",
        "Path = Game/Game.exe",
        "Size = 1422000",
        "Packed Size = 1422000",
        "",
        "Path = Game/data.xp3",
        "Size = 420000000",
        "Packed Size = 420000000",
        "",
      ].join("\n"),
      stderr: "",
    }),
  });
  assert.equal(listedIsoPreview.status, "ok");
  assert.equal(listedIsoPreview.packageKind, "disc-image");
  assert.equal(listedIsoPreview.fileCount, 3);
  assert.deepEqual(listedIsoPreview.signals.launchSamples, ["Game/Game.exe"]);
  assert.deepEqual(listedIsoPreview.signals.installerSamples, ["Install/SetupJP.exe"]);
  assert.match(listedIsoPreview.warnings[0], /Disc image directory listed/);

  const autorunDiscPreview = parseSevenZipListOutput(
    [
      "Path = InstallDisc.iso",
      "Type = Iso",
      "",
      "Path = autorun.inf",
      "Size = 120",
      "Packed Size = 120",
      "",
      "Path = Start.exe",
      "Size = 2412000",
      "Packed Size = 2412000",
      "",
      "Path = data1.cab",
      "Size = 760000000",
      "Packed Size = 760000000",
      "",
    ].join("\n"),
    "ISO disc image",
    {
      packageKind: "disc-image",
      warnings: ["Disc image directory listed with a local 7z-compatible command; no files were extracted."],
    },
  );
  assert.equal(autorunDiscPreview.status, "ok");
  assert.equal(autorunDiscPreview.packageKind, "disc-image");
  assert.equal(autorunDiscPreview.signals.launchCandidateCount, 0);
  assert.deepEqual(autorunDiscPreview.signals.launchSamples, []);
  assert.equal(autorunDiscPreview.signals.installerCount, 3);
  assert.deepEqual(autorunDiscPreview.signals.installerSamples, ["Start.exe", "autorun.inf", "data1.cab"]);
  assert.match(autorunDiscPreview.warnings.join(" "), /Autorun\/install-media layout detected/);

  const blindWritePath = path.join(tempDir, "AsterOld.b6t");
  await fs.writeFile(blindWritePath, Buffer.alloc(32));
  const blindWritePreview = await previewDiscImageFile(blindWritePath, "b6t", { runExternalListImpl: async () => ({ missing: true }) });
  assert.equal(blindWritePreview.packageKind, "disc-image");
  assert.match(blindWritePreview.warnings[0], /Descriptor metadata/);

  const neroPath = path.join(tempDir, "Tokuten.nrg");
  await fs.writeFile(neroPath, Buffer.alloc(32));
  const neroPreview = await previewDiscImageFile(neroPath, "nrg", { runExternalListImpl: async () => ({ missing: true }) });
  assert.equal(neroPreview.packageKind, "disc-image");
  assert.match(neroPreview.warnings[0], /Legacy disc image/);

  await fs.rm(tempDir, { recursive: true, force: true });
  console.log("Archive preview smoke passed.");
}

function makeZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const content = Buffer.from(entry.content || "", "utf8");
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x800, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt32LE(0, 10);
    localHeader.writeUInt32LE(0, 14);
    localHeader.writeUInt32LE(content.length, 18);
    localHeader.writeUInt32LE(content.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, name, content);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x800, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt32LE(0, 12);
    centralHeader.writeUInt32LE(0, 16);
    centralHeader.writeUInt32LE(content.length, 20);
    centralHeader.writeUInt32LE(content.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, name);

    offset += localHeader.length + name.length + content.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const centralDirectoryOffset = offset;
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDirectory.length, 12);
  eocd.writeUInt32LE(centralDirectoryOffset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirectory, eocd]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
