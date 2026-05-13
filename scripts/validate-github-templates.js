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
  ".github/ISSUE_TEMPLATE/config.yml",
  ".github/pull_request_template.md",
  ".github/workflows/ci.yml",
  "docs/CONTRIBUTING.md",
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
    "Do not include",
    "cracks",
    "access tokens",
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

function checkWorkflow(errors) {
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
    "npm ci --ignore-scripts",
    "npm run check",
  ]) {
    assert(text.includes(phrase), `${file} is missing phrase: ${phrase}`, errors);
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
  checkWorkflow(errors);
  checkPrTemplate(errors);
  checkContributing(errors);

  if (errors.length) {
    throw new Error(`Invalid GitHub templates:\n- ${errors.join("\n- ")}`);
  }

  console.log(`Validated ${ISSUE_FORMS.length} issue forms, PR template, contribution guide, and CI workflow.`);
}

main();
