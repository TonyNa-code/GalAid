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

function makePeExecutable({ machine, magic }) {
  const buffer = Buffer.alloc(256);
  buffer.write("MZ", 0, "ascii");
  buffer.writeUInt32LE(0x80, 0x3c);
  buffer.write("PE\0\0", 0x80, "binary");
  buffer.writeUInt16LE(machine, 0x84);
  buffer.writeUInt16LE(0xe0, 0x94);
  buffer.writeUInt16LE(magic, 0x98);
  buffer.writeUInt16LE(2, 0x98 + 68);
  return buffer;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
