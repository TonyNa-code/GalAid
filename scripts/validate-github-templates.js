const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const PUBLISHED_WINDOWS_BETA_COMMIT = "60cafbc936bdbb31f16a78d3fc9da50b4c6ccb98";

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
  "README.md",
  "README.zh-CN.md",
  "README.ja.md",
  ".github/ISSUE_TEMPLATE/config.yml",
  ".github/pull_request_template.md",
  ".github/workflows/ci.yml",
  ".github/workflows/desktop-release.yml",
  ".github/workflows/pages.yml",
  "data/engine-rules.json",
  "docs/CONTRIBUTING.md",
  "docs/DESKTOP.md",
  "docs/ENGINE_RULES.md",
  "docs/GOOD_FIRST_ISSUES.md",
  "docs/INSTALL.zh-CN.md",
  "docs/RELEASE_DRAFT.md",
  "docs/REPO_TOPICS.md",
  "desktop/archive-preview.js",
  "desktop/package-prep.js",
  "desktop/launcher.js",
  "playwright.config.js",
  "scripts/build-engine-rules.js",
  "scripts/test-desktop-launcher.js",
  "scripts/test-archive-preview.js",
  "scripts/test-package-prep.js",
  "scripts/test-release-verifier.js",
  "scripts/release-audit.js",
  "scripts/verify-release-assets.js",
  "src/engine-rules.js",
  "tests/galaid-smoke.spec.js",
];

function readRelative(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) throw new Error(`${relativePath} is missing`);
  return fs.readFileSync(absolutePath, "utf8");
}

function readPackageVersion() {
  return JSON.parse(readRelative("package.json")).version;
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
    "data/engine-rules.json",
    "`npm run build:engines`",
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
    "data/engine-rules.json",
    "npm run build:recipes",
    "npm run build:engines",
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

  const expectedVersionHeading = `v${readPackageVersion()} beta`;
  for (const phrase of [
    expectedVersionHeading,
    "Highlights",
    "Error screenshot OCR",
    "Release verifier checks published Windows sidecars",
    "Pre-Release Checklist",
    "Published Status",
    "2026-05-31 Asia/Shanghai",
    "SakuraTrial",
    "Repository topics",
    "npm run audit:release -- --strict",
    "npm run verify:release -- v0.1.9-beta",
    PUBLISHED_WINDOWS_BETA_COMMIT,
    "--json",
    "https://github.com/TonyNa-code/GalAid/releases/tag/v0.1.9-beta",
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

function checkReadmes(errors) {
  const readmes = [
    {
      file: "README.md",
      phrases: ["Languages: English", "README.zh-CN.md", "README.ja.md", "docs/INSTALL.zh-CN.md", "GalAid is a launch doctor", "Screenshot OCR", "Download And Verify", "GalAid-0.1.9-win-x64.exe.release.json", PUBLISHED_WINDOWS_BETA_COMMIT, "--json"],
    },
    {
      file: "README.zh-CN.md",
      phrases: ["GalAid 是一个本地优先", "docs/INSTALL.zh-CN.md", "诊断语言", "商业/自研", "报错截图 OCR", "Windows 便携版下载", "GalAid-0.1.9-win-x64.exe.sha256", PUBLISHED_WINDOWS_BETA_COMMIT],
    },
    {
      file: "README.ja.md",
      phrases: ["GalAid は", "診断言語", "商用/自社", "エラー画像 OCR", "Windows Portable Beta", "GalAid-0.1.9-win-x64.exe.sha256", PUBLISHED_WINDOWS_BETA_COMMIT],
    },
  ];

  for (const readme of readmes) {
    const text = readRelative(readme.file);
    checkNoTrailingWhitespace(readme.file, text, errors);
    for (const phrase of readme.phrases) {
      assert(text.includes(phrase), `${readme.file} is missing phrase: ${phrase}`, errors);
    }
  }
}

function checkInstallGuide(errors) {
  const file = "docs/INSTALL.zh-CN.md";
  const text = readRelative(file);
  checkNoTrailingWhitespace(file, text, errors);

  for (const phrase of [
    "GalAid 中文快速安装与群分享稿",
    "Windows 便携版",
    "群分享短文案",
    "第一次使用",
    "它会自动处理什么",
    "需要解压密码",
    "求助包",
    "GalAid-0.1.9-win-x64.exe",
    "GalAid-0.1.9-win-x64.exe.sha256",
    "GalAid-0.1.9-win-x64.exe.release.json",
    "npm run verify:release -- v0.1.9-beta",
    PUBLISHED_WINDOWS_BETA_COMMIT,
    "--json",
    "Get-FileHash",
    "https://github.com/TonyNa-code/GalAid/releases/download/v0.1.9-beta/GalAid-0.1.9-win-x64.exe",
    "https://github.com/TonyNa-code/GalAid/releases/download/v0.1.9-beta/GalAid-0.1.9-win-x64.exe.sha256",
    "https://github.com/TonyNa-code/GalAid/releases/download/v0.1.9-beta/GalAid-0.1.9-win-x64.exe.release.json",
  ]) {
    assert(text.includes(phrase), `${file} is missing phrase: ${phrase}`, errors);
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

function checkReleaseVerifierScript(errors) {
  const file = "scripts/verify-release-assets.js";
  const testFile = "scripts/test-release-verifier.js";
  const text = readRelative(file);
  const testText = readRelative(testFile);
  checkNoTrailingWhitespace(file, text, errors);
  checkNoTrailingWhitespace(testFile, testText, errors);

  for (const phrase of [
    "galaid.windowsReleaseAsset.v1",
    "browser_download_url",
    "Large .exe download was not required.",
    "GitHub asset digest",
    "Release asset verification failed",
    "module.exports",
    "expectedCommit",
    "withRetries",
    "retryDelayMs",
    "galaid.releaseVerification.v1",
    "--json",
    PUBLISHED_WINDOWS_BETA_COMMIT,
  ]) {
    assert(text.includes(phrase), `${file} is missing phrase: ${phrase}`, errors);
  }

  for (const phrase of [
    "Release verifier smoke passed",
    "parseArgs",
    "parseChecksum",
    "validateRelease",
    "buildVerificationSummary",
    "Manifest commit mismatch",
    "Manifest SHA-256 does not match checksum sidecar",
    "transient release metadata",
  ]) {
    assert(testText.includes(phrase), `${testFile} is missing phrase: ${phrase}`, errors);
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
    "actions/checkout@v6",
    "actions/setup-node@v6",
    "node-version: 24",
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
    "actions/checkout@v6",
    "actions/setup-node@v6",
    "actions/configure-pages@v6",
    "actions/upload-pages-artifact@v5",
    "actions/deploy-pages@v5",
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
    "data/engine-rules.json",
    "npm run build:engines",
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

  for (const phrase of [
    "游戏样例",
    "自研样例",
    "界面/诊断语言",
    "Interface / diagnosis language",
    "UI / 診断言語",
    "Assistant language",
    "Support bundle",
    "GalAid サポート概要",
    "DirectX 旧组件",
    "VC++ 运行库",
    "roadmap.json",
    "诊断摘要",
    "error screenshot OCR",
    "ZIP 目录预检",
    "商业/自研引擎启动链",
    "prepared desktop handoff",
    "SakuraTrial-prepared",
    "launch attempt follow-up",
    "markLaunchAttemptSymptom",
  ]) {
    assert(testText.includes(phrase), `${testFile} is missing phrase: ${phrase}`, errors);
  }
}

function checkEngineRules(errors) {
  const dataFile = "data/engine-rules.json";
  const generatedFile = "src/engine-rules.js";
  const docsFile = "docs/ENGINE_RULES.md";
  const dataText = readRelative(dataFile);
  const generatedText = readRelative(generatedFile);
  const docsText = readRelative(docsFile);

  checkNoTrailingWhitespace(dataFile, dataText, errors);
  checkNoTrailingWhitespace(generatedFile, generatedText, errors);
  checkNoTrailingWhitespace(docsFile, docsText, errors);

  let rules = [];
  try {
    rules = JSON.parse(dataText);
  } catch (error) {
    errors.push(`${dataFile} must be valid JSON: ${error.message}`);
  }

  for (const phrase of [
    "GALAID_ENGINE_RULES",
    "data/engine-rules.json",
    "npm run build:engines",
    "KiriKiri / 吉里吉里",
    "commercial-proprietary",
  ]) {
    assert(generatedText.includes(phrase) || docsText.includes(phrase) || dataText.includes(phrase), `engine rules are missing phrase: ${phrase}`, errors);
  }

  if (Array.isArray(rules)) {
    for (const id of ["kirikiri", "renpy", "commercial-proprietary"]) {
      assert(rules.some((rule) => rule.id === id), `${dataFile} is missing ${id}`, errors);
    }
  }
}

function checkDesktopRelease(errors) {
  const workflowFile = ".github/workflows/desktop-release.yml";
  const desktopDoc = "docs/DESKTOP.md";
  const packageFile = "package.json";
  const workflowText = readRelative(workflowFile);
  const desktopText = readRelative(desktopDoc);
  const packageText = readRelative(packageFile);

  checkNoTrailingWhitespace(workflowFile, workflowText, errors);
  checkNoTrailingWhitespace(desktopDoc, desktopText, errors);
  checkNoTrailingWhitespace(packageFile, packageText, errors);

  for (const phrase of [
    "windows-2025-vs2026",
    "actions/checkout@v6",
    "actions/setup-node@v6",
    "npm ci --ignore-scripts",
    "npm run check",
    "npm run dist:win",
    "Get-FileHash",
    "Set-Content",
    "galaid.windowsReleaseAsset.v1",
    "ConvertTo-Json",
    "actions/upload-artifact@v7",
    "dist/desktop/*.exe",
    "dist/desktop/*.exe.sha256",
    "dist/desktop/*.exe.release.json",
    "github.ref_name",
    "releaseCreateArgs",
    "--generate-notes",
    "--prerelease",
    "gh release upload",
    "Verify published Windows release assets",
    "npm run verify:release -- $env:RELEASE_TAG --repo $env:GITHUB_REPOSITORY --commit $env:GITHUB_SHA",
  ]) {
    assert(workflowText.includes(phrase), `${workflowFile} is missing phrase: ${phrase}`, errors);
  }

  for (const phrase of [
    "electron-builder",
    "portable",
    "requestedExecutionLevel",
    "asInvoker",
    "dist:win",
    "verify:release",
    "test:release",
    "data/**/*",
  ]) {
    assert(packageText.includes(phrase), `${packageFile} is missing desktop build phrase: ${phrase}`, errors);
  }

  for (const phrase of ["Windows Portable Build", "workflow_dispatch", "npm run audit:release -- --strict", "npm run verify:release -- v0.1.9-beta", PUBLISHED_WINDOWS_BETA_COMMIT, "--json"]) {
    assert(desktopText.includes(phrase), `${desktopDoc} is missing phrase: ${phrase}`, errors);
  }
}

function checkDesktopLauncher(errors) {
  const launcherFile = "desktop/launcher.js";
  const testFile = "scripts/test-desktop-launcher.js";
  const preloadFile = "desktop/preload.js";
  const mainFile = "desktop/main.js";
  const launcherText = readRelative(launcherFile);
  const testText = readRelative(testFile);
  const preloadText = readRelative(preloadFile);
  const mainText = readRelative(mainFile);

  checkNoTrailingWhitespace(launcherFile, launcherText, errors);
  checkNoTrailingWhitespace(testFile, testText, errors);

  for (const phrase of [
    "buildLaunchAllowlist",
    "createShortcutForAllowedEntry",
    "launchAllowedEntry",
    "unsupported-platform",
    "not-allowed",
    "detached: true",
  ]) {
    assert(launcherText.includes(phrase), `${launcherFile} is missing phrase: ${phrase}`, errors);
  }

  for (const phrase of ["desktop:scan-paths", "desktop:launch-entry", "desktop:create-shortcut", "desktop:prepare-package", "desktop:unmount-image", "scanPaths", "launchEntry", "createShortcut", "preparePackage", "unmountImage"]) {
    assert(preloadText.includes(phrase) || mainText.includes(phrase), `desktop launch bridge is missing phrase: ${phrase}`, errors);
  }

  for (const phrase of ["Desktop launcher smoke passed", "platform: \"win32\"", "not-allowed", "normalizeShortcutPath"]) {
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
    "parseSevenZipListOutput",
    "previewDiscImageFile",
    "metadata preview",
    "encryptedEntries",
  ]) {
    assert(previewText.includes(phrase), `${previewFile} is missing phrase: ${phrase}`, errors);
  }

  for (const phrase of ["makeZip", "SnowTrial/Game.exe", "MoonlightCafe/Game.exe", "metadata only", "Archive preview smoke passed"]) {
    assert(testText.includes(phrase), `${testFile} is missing phrase: ${phrase}`, errors);
  }
}

function checkPackagePrep(errors) {
  const prepFile = "desktop/package-prep.js";
  const testFile = "scripts/test-package-prep.js";
  const prepText = readRelative(prepFile);
  const testText = readRelative(testFile);

  checkNoTrailingWhitespace(prepFile, prepText, errors);
  checkNoTrailingWhitespace(testFile, testText, errors);

  for (const phrase of ["prepareArchivePackage", "prepareDiscImagePackage", "isPrepareSupportedPackage", "7zip-bin", "Mount-DiskImage", "Dismount-DiskImage", "password-failed", "tool-missing"]) {
    assert(prepText.includes(phrase), `${prepFile} is missing phrase: ${phrase}`, errors);
  }

  for (const phrase of ["Package prep smoke passed", "knownPassword", "Game.part2.rar", "Disc.iso", "Windows Mount-DiskImage", "Windows Dismount-DiskImage", "tool-missing"]) {
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
  checkReadmes(errors);
  checkInstallGuide(errors);
  checkGoodFirstIssues(errors);
  checkBrowserSmoke(errors);
  checkArchivePreview(errors);
  checkPackagePrep(errors);
  checkEngineRules(errors);
  checkDesktopRelease(errors);
  checkDesktopLauncher(errors);
  checkSecurityPolicy(errors);
  checkCodeOfConduct(errors);
  checkReleaseDocs(errors);
  checkReleaseAuditScript(errors);
  checkReleaseVerifierScript(errors);

  if (errors.length) {
    throw new Error(`Invalid GitHub templates:\n- ${errors.join("\n- ")}`);
  }

  console.log(`Validated ${ISSUE_FORMS.length} issue forms, release docs, project policies, and workflows.`);
}

main();
