const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { scanSelectedPaths } = require("../desktop/scanner");

async function main() {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "galaid-scanner-"));
  try {
    await fs.writeFile(path.join(tempRoot, "DOSGAME.COM"), Buffer.from([0xb4, 0x4c, 0xcd, 0x21]));
    await fs.writeFile(path.join(tempRoot, "DOSGAME.EXE"), makeMzExecutable());
    await fs.writeFile(path.join(tempRoot, "WIN16.EXE"), makeNeExecutable());
    await fs.writeFile(path.join(tempRoot, "WIN32.EXE"), makePeExecutable({ machine: 0x014c, magic: 0x10b }));
    await fs.writeFile(path.join(tempRoot, "WIN64.EXE"), makePeExecutable({ machine: 0x8664, magic: 0x20b }));
    await fs.writeFile(path.join(tempRoot, "WINCOM.COM"), makePeExecutable({ machine: 0x014c, magic: 0x10b }));
    await fs.writeFile(path.join(tempRoot, "Disc.cue"), 'FILE "Track01.bin" BINARY\n  TRACK 01 MODE1/2352\n');
    await fs.writeFile(
      path.join(tempRoot, "XP32.EXE"),
      makePeExecutable({
        machine: 0x014c,
        magic: 0x10b,
        subsystemVersion: [5, 1],
        imports: ["KERNEL32.dll", "DDRAW.dll", "DSOUND.dll", "DPLAYX.dll", "DPNET.dll", "WINMM.dll", "QUARTZ.dll", "MSVCR71.dll", "MSVBVM60.dll", "mscoree.dll", "qtmlclient.dll", "FLASH.OCX", "MSCOMCTL.OCX", "rtl60.bpl"],
      }),
    );

    const result = await scanSelectedPaths([tempRoot]);
    const byName = new Map(result.files.map((file) => [file.name, file]));

    assert.equal(byName.get("DOSGAME.COM").executableInfo.runtime, "dos");
    assert.equal(byName.get("DOSGAME.COM").executableInfo.format, "dos-com");
    assert.equal(byName.get("DOSGAME.EXE").executableInfo.runtime, "dos");
    assert.equal(byName.get("DOSGAME.EXE").executableInfo.format, "mz");
    assert.equal(byName.get("WIN16.EXE").executableInfo.runtime, "win16");
    assert.equal(byName.get("WIN16.EXE").executableInfo.format, "ne");
    assert.equal(byName.get("WIN32.EXE").executableInfo.runtime, "win32");
    assert.equal(byName.get("WIN32.EXE").executableInfo.architecture, "x86");
    assert.equal(byName.get("WIN64.EXE").executableInfo.runtime, "win64");
    assert.equal(byName.get("WIN64.EXE").executableInfo.architecture, "x64");
    assert.equal(byName.get("WINCOM.COM").executableInfo.runtime, "win32");
    assert.equal(byName.get("WINCOM.COM").executableInfo.architecture, "x86");
    assert.equal(byName.get("XP32.EXE").executableInfo.runtime, "win32");
    assert.equal(byName.get("XP32.EXE").executableInfo.subsystemVersion, "5.1");
    assert.equal(byName.get("XP32.EXE").executableInfo.targetEra, "win2000-xp-era");
    assert.deepEqual(byName.get("XP32.EXE").executableInfo.runtimeImports, [
      "ddraw.dll",
      "dsound.dll",
      "dplayx.dll",
      "dpnet.dll",
      "winmm.dll",
      "quartz.dll",
      "msvcr71.dll",
      "msvbvm60.dll",
      "mscoree.dll",
      "qtmlclient.dll",
      "flash.ocx",
      "mscomctl.ocx",
      "rtl60.bpl",
    ]);
    assert.deepEqual(byName.get("XP32.EXE").executableInfo.importHints, [
      "legacy-directdraw",
      "legacy-directsound",
      "legacy-directplay",
      "legacy-winmm",
      "legacy-vc",
      "legacy-vb6",
      "legacy-dotnet",
      "legacy-quicktime",
      "legacy-directshow",
      "legacy-flash",
      "legacy-activex-controls",
      "legacy-borland",
    ]);
    assert.match(byName.get("Disc.cue").textPreview, /Track01\.bin/);
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }

  console.log("Desktop scanner smoke passed.");
}

function makeMzExecutable() {
  const buffer = Buffer.alloc(64);
  buffer.write("MZ", 0, "ascii");
  return buffer;
}

function makeNeExecutable() {
  const buffer = Buffer.alloc(128);
  buffer.write("MZ", 0, "ascii");
  buffer.writeUInt32LE(0x40, 0x3c);
  buffer.write("NE", 0x40, "ascii");
  return buffer;
}

function makePeExecutable({ machine, magic, subsystemVersion = [6, 0], imports = [] }) {
  const buffer = Buffer.alloc(imports.length ? 2048 : 256);
  const peOffset = 0x80;
  const optionalHeaderOffset = 0x98;
  buffer.write("MZ", 0, "ascii");
  buffer.writeUInt32LE(peOffset, 0x3c);
  buffer.write("PE\0\0", peOffset, "binary");
  buffer.writeUInt16LE(machine, peOffset + 4);
  buffer.writeUInt16LE(imports.length ? 1 : 0, peOffset + 6);
  buffer.writeUInt16LE(0xe0, peOffset + 20);
  buffer.writeUInt16LE(magic, optionalHeaderOffset);
  buffer.writeUInt16LE(subsystemVersion[0], optionalHeaderOffset + 48);
  buffer.writeUInt16LE(subsystemVersion[1], optionalHeaderOffset + 50);
  buffer.writeUInt16LE(2, optionalHeaderOffset + 68);
  buffer.writeUInt32LE(16, optionalHeaderOffset + 92);
  if (imports.length) writeImportSection(buffer, optionalHeaderOffset, imports);
  return buffer;
}

function writeImportSection(buffer, optionalHeaderOffset, imports) {
  const sectionTableOffset = 0x80 + 24 + 0xe0;
  const rawBase = 0x200;
  const rvaBase = 0x1000;
  const descriptorBytes = (imports.length + 1) * 20;
  buffer.writeUInt32LE(rvaBase, optionalHeaderOffset + 104);
  buffer.writeUInt32LE(descriptorBytes, optionalHeaderOffset + 108);
  buffer.write(".idata", sectionTableOffset, "ascii");
  buffer.writeUInt32LE(0x400, sectionTableOffset + 8);
  buffer.writeUInt32LE(rvaBase, sectionTableOffset + 12);
  buffer.writeUInt32LE(0x400, sectionTableOffset + 16);
  buffer.writeUInt32LE(rawBase, sectionTableOffset + 20);

  let nameOffset = rawBase + descriptorBytes;
  imports.forEach((dll, index) => {
    const descriptorOffset = rawBase + index * 20;
    buffer.writeUInt32LE(rvaBase + 0x300 + index * 8, descriptorOffset + 16);
    buffer.writeUInt32LE(rvaBase + (nameOffset - rawBase), descriptorOffset + 12);
    buffer.write(`${dll}\0`, nameOffset, "ascii");
    nameOffset += Buffer.byteLength(dll, "ascii") + 1;
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
