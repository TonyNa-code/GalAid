const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.join(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const REQUIRED_SOURCES = ["index.html", "src", "data/error-recipes.json", "LICENSE"];
const REQUIRED_OUTPUTS = ["index.html", "src/app.js", "src/styles.css", "src/error-recipes.js", ".nojekyll"];

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function assertPathExists(base, relativePath, errors) {
  if (!fs.existsSync(path.join(base, relativePath))) errors.push(`${relativePath} is missing`);
}

function collectIndexReferences(indexHtml) {
  const refs = [];
  const pattern = /\b(?:href|src)="\.\/([^"#?]+)(?:[#?][^"]*)?"/g;
  let match;

  while ((match = pattern.exec(indexHtml))) {
    refs.push(match[1]);
  }

  return refs;
}

function validateSources() {
  const errors = [];

  execFileSync(process.execPath, [path.join(ROOT, "scripts", "build-error-recipes.js"), "--check"], {
    cwd: ROOT,
    stdio: "inherit",
  });

  for (const relativePath of REQUIRED_SOURCES) assertPathExists(ROOT, relativePath, errors);

  const indexHtml = read("index.html");
  for (const relativePath of collectIndexReferences(indexHtml)) {
    assertPathExists(ROOT, relativePath, errors);
    if (relativePath.startsWith("desktop/") || relativePath.startsWith("node_modules/")) {
      errors.push(`index.html must not reference ${relativePath}`);
    }
  }

  if (errors.length) {
    throw new Error(`Invalid Pages sources:\n- ${errors.join("\n- ")}`);
  }
}

function copyEntry(relativePath) {
  const from = path.join(ROOT, relativePath);
  const to = path.join(DIST, relativePath);

  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true });
}

function buildPages() {
  validateSources();

  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  for (const relativePath of REQUIRED_SOURCES) copyEntry(relativePath);
  fs.writeFileSync(path.join(DIST, ".nojekyll"), "");

  validateDist();
  console.log("Built GitHub Pages artifact in dist/.");
}

function validateDist() {
  const errors = [];
  const indexPath = path.join(DIST, "index.html");

  for (const relativePath of REQUIRED_OUTPUTS) assertPathExists(DIST, relativePath, errors);

  if (fs.existsSync(indexPath)) {
    const indexHtml = fs.readFileSync(indexPath, "utf8");
    for (const relativePath of collectIndexReferences(indexHtml)) {
      assertPathExists(DIST, relativePath, errors);
    }
  }

  if (errors.length) {
    throw new Error(`Invalid Pages artifact:\n- ${errors.join("\n- ")}`);
  }
}

function main() {
  if (process.argv.includes("--check")) {
    validateSources();
    console.log("Validated GitHub Pages source files.");
    return;
  }

  buildPages();
}

main();
