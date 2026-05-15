const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");

const ISSUE_FORMS = [
  {
    file: ".github/ISSUE_TEMPLATE/bug-report.yml",
    ids: ["problem", "steps", "expected", "galaid-output", "surface", "safety"],
    phrases: ["Bug report", "metadata-only", "No game files", "required: true"],
  },
  {
    file: ".github/ISSUE_TEMPLATE/diagnosis-help.yml",
    ids: ["summary", "tried", "expected", "safety"],
    phrases: ["Diagnosis help", "求助", "Do not upload game files", "required: true"],
  },
  {
    file: ".github/ISSUE_TEMPLATE/error-recipe.yml",
    ids: ["error-text", "likely-cause", "safe-action", "category", "galaid-output", "safety"],
    phrases: ["New error recipe", "Redacted error text", "community recipe library", "required: true"],
  },
];

const REQUIRED_FILES = [
  "CODE_OF_CONDUCT.md",
  "SECURITY.md",
  ".github/ISSUE_TEMPLATE/config.yml",
  ".github/pull_request_template.md",
  ".github/workflows/ci.yml",
  ".github/workflows/pages.yml",
  "docs/CONTRIBUTING.md",
  "docs/GOOD_FIRST_ISSUES.md",
  "docs/RELEASE_DRAFT.md",
  "docs/REPO_TOPICS.md",
  "desktop/archive-preview.js",
  "playwright.config.js",
  "scripts/test-archive-preview.js",
  "scripts/release-audit.js",
  "tests/galaid-smoke.spec.js",
];

function readRelative(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) throw new Error(`${relativePath} is missing`);
  return fs.readFileSync(absolutePath, "utf8");
}

function assert(condition, message, errors) {
  if (!condition) errors.push(message);
}

function checkNoTrailingWhitespace(relativePath, text, errors) {
  text.split(/\r?\n/).forEach((line, index) => {
    if (/[ \t]+$/.test(line)) errors.push(`${relativePath}:${index + 1} has trailing whitespace`);
  });
}

function checkIssueForm(form, errors) {
  const text = readRelative(form.file);
  checkNoTrailingWhitespace(form.file, text, errors);

  for (const key of ["name:", "description:", "title:", "labels:", "body:"]) {
    assert(text.includes(key), `${form.file} is missing ${key}`, errors);
  }

  for (const id of form.ids) {
    assert(new RegExp(`\\bid:\\s*${escapeRegExp(id)}\\b`).test(text), `${form.file} is missing id: ${id}`, errors);
  }

  for (const phrase of form.phrases) {
    assert(text.includes(phrase), `${form.file} is missing phrase: ${phrase}`, errors);
  }

  assert(text.includes("I removed private paths"), `${form.file} must ask users to redact private paths`, errors);
  assert(text.includes("I did not attach game files"), `${form.file} must reject game files and extracted assets`, errors);
}

function checkPrTemplate(errors) {
  const file = ".github/pull_request_template.md";
  const text = readRelative(file);
  checkNoTrailingWhitespace(file, text, errors);

  for (const phrase of [
    "## Summary",
    "## Type",
    "## Checks",
    "`npm run check`",
    "data/error-recipes.json",
    "metadata-only",
    "game files",
    "bypass instructions",
  ]) {
    assert(text.includes(phrase), `${file} is missing phrase: ${phrase}`, errors);
  }
}

function checkContributing(errors) {
  const file = "docs/CONTRIBUTING.md";
  const text = readRelative(file);
  checkNoTrailingWhitespace(file, text, errors);

  for (const phrase of [
    "local-first",
    "data/error-recipes.json",
    "npm run build:recipes",
    "npm run check",
    "SECURITY.md",
    "CODE_OF_CONDUCT.md",
    "Do not include",
    "cracks",
    "access tokens",
  ]) {
    assert(text.includes(phrase), `${file} is missing phrase: ${phrase}`, errors);
  }
}

function checkSecurityPolicy(errors) {
  const file = "SECURITY.md";
  const text = readRelative(file);
  checkNoTrailingWhitespace(file, text, errors);

  for (const phrase of [
    "Security Policy",
    "local-first",
    "Report a Vulnerability",
    "Security Boundary",
    "metadata only",
    "must not upload, execute, modify, decrypt, or extract",
    "game files",
    "tokens",
  ]) {
    assert(text.includes(phrase), `${file} is missing phrase: ${phrase}`, errors);
  }
}

function checkCodeOfConduct(errors) {
  const file = "CODE_OF_CONDUCT.md";
  const text = readRelative(file);
  checkNoTrailingWhitespace(file, text, errors);

  for (const phrase of [
    "Code of Conduct",
    "welcoming to beginners",
    "Expected Behavior",
    "Unacceptable Behavior",
    "Enforcement",
    "cracks",
    "unauthorized downloads",
  ]) {
    assert(text.includes(phrase), `${file} is missing phrase: ${phrase}`, errors);
  }
}

function checkReleaseDocs(errors) {
  const releaseFile = "docs/RELEASE_DRAFT.md";
  const topicsFile = "docs/REPO_TOPICS.md";
  const releaseText = readRelative(releaseFile);
  const topicsText = readRelative(topicsFile);

  checkNoTrailingWhitespace(releaseFile, releaseText, errors);
  checkNoTrailingWhitespace(topicsFile, topicsText, errors);

  for (const phrase of [
    "v0.1.0 beta",
    "Highlights",
    "Safety Boundary",
    "Pre-Release Checklist",
    "npm run audit:release -- --strict",
    "GitHub Pages",
    "Known Limits",
  ]) {
    assert(releaseText.includes(phrase), `${releaseFile} is missing phrase: ${phrase}`, errors);
  }

  for (const phrase of [
    "visual-novel",
    "galgame",
    "launch-doctor",
    "local-first",
    "metadata-only",
    "github-pages",
  ]) {
    assert(topicsText.includes(phrase), `${topicsFile} is missing phrase: ${phrase}`, errors);
  }
}

function checkReleaseAuditScript(errors) {
  const file = "scripts/release-audit.js";
  const text = readRelative(file);
  checkNoTrailingWhitespace(file, text, errors);

  for (const phrase of [
    "PRIVATE_PATHS",
    "SECRET_ASSIGNMENT",
    "AI_MARKERS",
    "PLACEHOLDER_MARKERS",
    "auditGitMetadata",
    "Release audit passed",
  ]) {
    assert(text.includes(phrase), `${file} is missing phrase: ${phrase}`, errors);
  }
}

function checkConfig(errors) {
  const file = ".github/ISSUE_TEMPLATE/config.yml";
  const text = readRelative(file);
  checkNoTrailingWhitespace(file, text, errors);
  assert(text.includes("blank_issues_enabled: false"), `${file} must disable blank issues`, errors);
}

function checkCiWorkflow(errors) {
  const file = ".github/workflows/ci.yml";
  const text = readRelative(file);
  checkNoTrailingWhitespace(file, text, errors);

  for (const phrase of [
    "pull_request:",
    "push:",
    "branches:",
    "- main",
    "actions/checkout@v4",
    "actions/setup-node@v4",
    "node-version: 24",
    "FORCE_JAVASCRIPT_ACTIONS_TO_NODE24",
    "npm ci --ignore-scripts",
    "npm run check",
    "npx playwright install --with-deps chromium",
    "npm run test:smoke",
  ]) {
    assert(text.includes(phrase), `${file} is missing phrase: ${phrase}`, errors);
  }
}

function checkPagesWorkflow(errors) {
  const file = ".github/workflows/pages.yml";
  const text = readRelative(file);
  checkNoTrailingWhitespace(file, text, errors);

  for (const phrase of [
    "workflow_dispatch:",
    "pages: write",
    "id-token: write",
    "actions/configure-pages@v5",
    "actions/upload-pages-artifact@v3",
    "actions/deploy-pages@v4",
    "FORCE_JAVASCRIPT_ACTIONS_TO_NODE24",
    "npm run check",
    "npx playwright install --with-deps chromium",
    "npm run test:smoke",
    "npm run build:pages",
    "path: dist",
  ]) {
    assert(text.includes(phrase), `${file} is missing phrase: ${phrase}`, errors);
  }
}

function checkGoodFirstIssues(errors) {
  const file = "docs/GOOD_FIRST_ISSUES.md";
  const text = readRelative(file);
  checkNoTrailingWhitespace(file, text, errors);

  for (const phrase of [
    "Good First Issues",
    "good first issue",
    "Acceptance checklist",
    "data/error-recipes.json",
    "KiriKiri",
    "commercial/self-developed engine",
    "browser smoke",
    "metadata-only",
  ]) {
    assert(text.includes(phrase), `${file} is missing phrase: ${phrase}`, errors);
  }
}

function checkBrowserSmoke(errors) {
  const configFile = "playwright.config.js";
  const testFile = "tests/galaid-smoke.spec.js";
  const configText = readRelative(configFile);
  const testText = readRelative(testFile);

  checkNoTrailingWhitespace(configFile, configText, errors);
  checkNoTrailingWhitespace(testFile, testText, errors);

  for (const phrase of ["defineConfig", "webServer", "python3 -m http.server", "chromium"]) {
    assert(configText.includes(phrase), `${configFile} is missing phrase: ${phrase}`, errors);
  }

  for (const phrase of ["游戏样例", "自研样例", "DirectX 旧组件", "VC++ 运行库", "roadmap.json", "不包含游戏文件", "ZIP 目录预检", "商业/自研引擎启动链"]) {
    assert(testText.includes(phrase), `${testFile} is missing phrase: ${phrase}`, errors);
  }
}

function checkArchivePreview(errors) {
  const previewFile = "desktop/archive-preview.js";
  const testFile = "scripts/test-archive-preview.js";
  const previewText = readRelative(previewFile);
  const testText = readRelative(testFile);

  checkNoTrailingWhitespace(previewFile, previewText, errors);
  checkNoTrailingWhitespace(testFile, testText, errors);

  for (const phrase of [
    "galaid.archivePreview.v1",
    "CENTRAL_DIRECTORY_SIGNATURE",
    "previewZipFile",
    "metadata preview",
    "encryptedEntries",
  ]) {
    assert(previewText.includes(phrase), `${previewFile} is missing phrase: ${phrase}`, errors);
  }

  for (const phrase of ["makeZip", "SnowTrial/Game.exe", "Archive preview smoke passed"]) {
    assert(testText.includes(phrase), `${testFile} is missing phrase: ${phrase}`, errors);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function main() {
  const errors = [];

  for (const file of REQUIRED_FILES) {
    const text = readRelative(file);
    checkNoTrailingWhitespace(file, text, errors);
  }

  ISSUE_FORMS.forEach((form) => checkIssueForm(form, errors));
  checkConfig(errors);
  checkCiWorkflow(errors);
  checkPagesWorkflow(errors);
  checkPrTemplate(errors);
  checkContributing(errors);
  checkGoodFirstIssues(errors);
  checkBrowserSmoke(errors);
  checkArchivePreview(errors);
  checkSecurityPolicy(errors);
  checkCodeOfConduct(errors);
  checkReleaseDocs(errors);
  checkReleaseAuditScript(errors);

  if (errors.length) {
    throw new Error(`Invalid GitHub templates:\n- ${errors.join("\n- ")}`);
  }

  console.log(`Validated ${ISSUE_FORMS.length} issue forms, release docs, project policies, and workflows.`);
}

main();
