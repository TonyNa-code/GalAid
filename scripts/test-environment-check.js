const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const {
  checkRuntimeEnvironment,
  inspectDirectX,
  inspectLocale,
  inspectRpgMakerRtp,
  inspectVisualCpp,
} = require("../desktop/environment-check");

async function main() {
  const spawned = [];
  const winResult = await checkRuntimeEnvironment({
    platform: "win32",
    spawnImpl: makeEnvironmentSpawn({ spawned }),
  });

  assert.equal(winResult.ok, true);
  assert.equal(winResult.platform, "win32");
  assert.equal(winResult.checks.length, 4);
  assert.equal(winResult.checks.find((check) => check.id === "directx-native").status, "good");
  assert.equal(winResult.checks.find((check) => check.id === "vcredist-native").status, "good");
  assert.equal(winResult.checks.find((check) => check.id === "rtp-native").status, "info");
  assert.equal(winResult.checks.find((check) => check.id === "locale-native").status, "info");
  assert.equal(spawned.length, 4);
  assert.equal(JSON.stringify(winResult).includes("C:\\Users"), false);

  const missingDirectX = await inspectDirectX(makeStaticSpawn(""));
  assert.equal(missingDirectX.status, "warning");

  const missingVc = await inspectVisualCpp(makeStaticSpawn(""));
  assert.equal(missingVc.status, "warning");

  const rtp = await inspectRpgMakerRtp(makeStaticSpawn("RPG Maker VX Ace RTP\n"));
  assert.equal(rtp.status, "good");

  const locale = await inspectLocale(makeStaticSpawn("CurrentCulture=ja-JP\nSystemLocale=ja-JP\n"));
  assert.equal(locale.status, "good");

  const nonWinResult = await checkRuntimeEnvironment({ platform: "darwin", spawnImpl: makeStaticSpawn("") });
  assert.equal(nonWinResult.ok, true);
  assert.equal(nonWinResult.checks[0].status, "info");

  console.log("Environment check smoke passed.");
}

function makeEnvironmentSpawn({ spawned = [] } = {}) {
  return (command, args, options) => {
    const script = String(args?.at(-1) || "");
    if (script.includes("d3dx9_43.dll")) {
      return makeChild({ spawned, command, args, options, stdout: "d3dx9_43.dll (System32)\nxinput1_3.dll (SysWOW64)\n" });
    }
    if (script.includes("Microsoft Visual C")) {
      return makeChild({ spawned, command, args, options, stdout: "Microsoft Visual C++ 2015-2022 Redistributable (x86)\n" });
    }
    if (script.includes("RPG.*Maker.*RTP")) {
      return makeChild({ spawned, command, args, options, stdout: "" });
    }
    if (script.includes("CurrentCulture")) {
      return makeChild({ spawned, command, args, options, stdout: "CurrentCulture=zh-CN\nCurrentUICulture=zh-CN\nSystemLocale=zh-CN\n" });
    }
    return makeChild({ spawned, command, args, options, code: 1, stderr: "unexpected script" });
  };
}

function makeStaticSpawn(stdout = "", stderr = "", code = 0) {
  return (command, args, options) => makeChild({ command, args, options, stdout, stderr, code });
}

function makeChild({ spawned = [], command, args, options, stdout = "", stderr = "", code = 0, error = null } = {}) {
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
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
