"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CLEAN_TARGETS = [
  "test-results",
  "playwright-report",
  "dist",
  "build",
  "output",
  ".playwright-cli",
];
const DEEP_CLEAN_TARGETS = ["node_modules"];
const KNOWN_ARGS = new Set(["--deps", "--dry-run", "--help", "-h"]);

function parseCleanArgs(argv) {
  const unknownArg = argv.find((arg) => !KNOWN_ARGS.has(arg));
  if (unknownArg) {
    throw new Error(`Unknown argument: ${unknownArg}`);
  }

  return {
    dryRun: argv.includes("--dry-run"),
    help: argv.includes("--help") || argv.includes("-h"),
    includeDeps: argv.includes("--deps"),
  };
}

function printHelp(log = console.log) {
  log(`Usage: node scripts/clean-workspace.js [--deps] [--dry-run]

Removes generated local artifacts from the GalAid workspace.

Options:
  --deps     Also remove node_modules/.
  --dry-run  Show what would be removed without deleting anything.
  -h, --help Show this help.`);
}

function getTargets({ includeDeps = false } = {}) {
  return includeDeps ? [...CLEAN_TARGETS, ...DEEP_CLEAN_TARGETS] : CLEAN_TARGETS;
}

function resolveTarget(root, relativePath) {
  const resolvedRoot = path.resolve(root);
  const target = path.resolve(resolvedRoot, relativePath);
  if (target !== resolvedRoot && !target.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`Refusing to clean outside the workspace: ${relativePath}`);
  }
  return target;
}

function removeTarget(relativePath, { root = ROOT, dryRun = false } = {}) {
  const target = resolveTarget(root, relativePath);
  if (!fs.existsSync(target)) {
    return { path: relativePath, removed: false, reason: "missing" };
  }

  if (dryRun) {
    return { path: relativePath, removed: false, wouldRemove: true };
  }

  fs.rmSync(target, { recursive: true, force: true });
  return { path: relativePath, removed: true };
}

function main(argv = process.argv.slice(2), { root = ROOT, log = console.log } = {}) {
  const options = parseCleanArgs(argv);
  if (options.help) {
    printHelp(log);
    return [];
  }

  const targets = getTargets(options);
  const results = targets.map((target) => removeTarget(target, { root, dryRun: options.dryRun }));
  const removed = results.filter((result) => result.removed);
  const wouldRemove = results.filter((result) => result.wouldRemove);

  if (options.dryRun) {
    if (!wouldRemove.length) {
      log("Workspace already clean.");
      return results;
    }
    for (const result of wouldRemove) {
      log(`Would remove ${result.path}`);
    }
    return results;
  }

  if (!removed.length) {
    log("Workspace already clean.");
    return results;
  }

  for (const result of removed) {
    log(`Removed ${result.path}`);
  }

  if (options.includeDeps) {
    log("Dependency folders removed. Run `npm install` before testing or packaging again.");
  }

  return results;
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message || error);
    process.exitCode = 1;
  }
}

module.exports = {
  CLEAN_TARGETS,
  DEEP_CLEAN_TARGETS,
  getTargets,
  main,
  parseCleanArgs,
  printHelp,
  removeTarget,
  resolveTarget,
};
