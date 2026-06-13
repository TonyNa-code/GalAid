"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  CLEAN_TARGETS,
  DEEP_CLEAN_TARGETS,
  getTargets,
  main,
  parseCleanArgs,
  resolveTarget,
} = require("./clean-workspace");

function makeWorkspace() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "galaid-clean-"));
}

function touchTarget(root, relativePath) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(target, { recursive: true });
  fs.writeFileSync(path.join(target, "marker.txt"), "generated");
}

function exists(root, relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function runWithLogs(argv, root) {
  const logs = [];
  const results = main(argv, { root, log: (line) => logs.push(line) });
  return { logs, results };
}

function testDefaultCleanKeepsDependencies() {
  const root = makeWorkspace();
  try {
    for (const target of CLEAN_TARGETS) touchTarget(root, target);
    for (const target of DEEP_CLEAN_TARGETS) touchTarget(root, target);

    const { logs, results } = runWithLogs([], root);
    assert.strictEqual(results.filter((result) => result.removed).length, CLEAN_TARGETS.length);
    assert(logs.includes("Removed test-results"));
    for (const target of CLEAN_TARGETS) assert.strictEqual(exists(root, target), false, target);
    for (const target of DEEP_CLEAN_TARGETS) assert.strictEqual(exists(root, target), true, target);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function testDryRunDoesNotRemoveTargets() {
  const root = makeWorkspace();
  try {
    for (const target of getTargets({ includeDeps: true })) touchTarget(root, target);

    const { logs, results } = runWithLogs(["--dry-run", "--deps"], root);
    assert.strictEqual(results.filter((result) => result.wouldRemove).length, getTargets({ includeDeps: true }).length);
    assert(logs.includes("Would remove node_modules"));
    for (const target of getTargets({ includeDeps: true })) assert.strictEqual(exists(root, target), true, target);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function testDeepCleanRemovesDependencies() {
  const root = makeWorkspace();
  try {
    for (const target of getTargets({ includeDeps: true })) touchTarget(root, target);

    const { logs } = runWithLogs(["--deps"], root);
    assert(logs.includes("Dependency folders removed. Run `npm install` before testing or packaging again."));
    for (const target of getTargets({ includeDeps: true })) assert.strictEqual(exists(root, target), false, target);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function testCleanEmptyWorkspace() {
  const root = makeWorkspace();
  try {
    const { logs, results } = runWithLogs([], root);
    assert.strictEqual(results.every((result) => result.reason === "missing"), true);
    assert.deepStrictEqual(logs, ["Workspace already clean."]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function testArgumentParsingAndPathGuard() {
  assert.deepStrictEqual(parseCleanArgs(["--deps", "--dry-run"]), {
    dryRun: true,
    help: false,
    includeDeps: true,
  });
  assert.throws(() => resolveTarget("/tmp/galaid-root", "../outside"), /outside the workspace/);
}

function testUnknownArgumentDoesNotRemoveTargets() {
  const root = makeWorkspace();
  try {
    touchTarget(root, "test-results");
    assert.throws(() => runWithLogs(["--dryrun"], root), /Unknown argument: --dryrun/);
    assert.strictEqual(exists(root, "test-results"), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function mainTest() {
  testDefaultCleanKeepsDependencies();
  testDryRunDoesNotRemoveTargets();
  testDeepCleanRemovesDependencies();
  testCleanEmptyWorkspace();
  testArgumentParsingAndPathGuard();
  testUnknownArgumentDoesNotRemoveTargets();
  console.log("Clean workspace smoke passed.");
}

mainTest();
