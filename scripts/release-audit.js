const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.join(__dirname, "..");
const STRICT = process.argv.includes("--strict");
const SKIP_EXTS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".icns", ".zip", ".asar"]);
const SKIP_PATH_PARTS = new Set(["node_modules", "dist", "output", ".playwright-cli", ".git"]);

const PLACEHOLDER_MARKERS = [
  "YOUR_" + "GITHUB_NAME",
  "https://<" + "owner>.github.io/GalAid/",
  "<" + "owner>",
];

const AI_MARKERS = [
  "Chat" + "GPT",
  "Open" + "AI",
  "Cod" + "ex",
  "as an " + "AI",
  "AI " + "assistant",
  "作为" + "AI",
  "我是" + "AI",
  "AI " + "对话口吻",
  "为" + "你设计",
];

const unsafeActions = ["down" + "load", "get", "install", "use", "share"];
const unsafeObjects = ["cr" + "ack", "key" + "gen", "ser" + "ial", "drm " + "bypass"];
const unsafeChineseObjects = ["破" + "解", "绕" + "过", "序列" + "号", "注册" + "码"];
const unsafeChineseActions = ["下" + "载", "获" + "取", "安" + "装", "分" + "享", "教" + "程"];
const UNSAFE_ADVICE = [
  new RegExp(`\\b(${unsafeActions.join("|")})\\b.{0,48}\\b(${unsafeObjects.join("|")})\\b`, "i"),
  new RegExp(`\\b(${unsafeObjects.join("|")})\\b.{0,48}\\b(${unsafeActions.join("|")})\\b`, "i"),
  new RegExp(`(${unsafeChineseObjects.join("|")}).{0,24}(${unsafeChineseActions.join("|")})`),
];

const SECRET_ASSIGNMENT = /\b(api[_-]?key|secret|token|password|passwd|private[_-]?key)\b\s*[:=]\s*["'][^"']{8,}["']/i;
const PRIVATE_PATHS = [
  /\/Users\/[A-Za-z0-9._-]+(?:\/|$)/,
  /\/home\/[A-Za-z0-9._-]+(?:\/|$)/,
  /[A-Za-z]:\\Users\\[^\\\r\n]+/i,
  /\/var\/folders\/[A-Za-z0-9/_-]+/,
];

function listCandidateFiles() {
  const output = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
    cwd: ROOT,
    encoding: "utf8",
  });

  return output
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((relativePath) => !shouldSkipPath(relativePath))
    .sort();
}

function shouldSkipPath(relativePath) {
  const parts = relativePath.split(/[\\/]/);
  if (parts.some((part) => SKIP_PATH_PARTS.has(part))) return true;
  return SKIP_EXTS.has(path.extname(relativePath).toLowerCase());
}

function readText(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  const buffer = fs.readFileSync(absolutePath);
  if (buffer.includes(0)) return "";
  return buffer.toString("utf8");
}

function pushIssue(issues, severity, relativePath, line, category, message) {
  issues.push({ severity, relativePath, line, category, message });
}

function auditText(relativePath, text, issues) {
  const lines = text.split(/\r?\n/);

  lines.forEach((lineText, index) => {
    const line = index + 1;

    for (const pattern of PRIVATE_PATHS) {
      if (pattern.test(lineText)) {
        pushIssue(issues, "error", relativePath, line, "private-path", "Possible private absolute path.");
      }
    }

    if (SECRET_ASSIGNMENT.test(lineText)) {
      pushIssue(issues, "error", relativePath, line, "secret", "Possible secret or API key assignment.");
    }

    for (const marker of AI_MARKERS) {
      if (lineText.toLowerCase().includes(marker.toLowerCase())) {
        pushIssue(issues, "error", relativePath, line, "ai-trace", `Possible internal AI wording: ${marker}`);
      }
    }

    for (const pattern of UNSAFE_ADVICE) {
      if (pattern.test(lineText) && !isSafetyDenial(lineText)) {
        pushIssue(issues, "error", relativePath, line, "unsafe-advice", "Possible unsafe crack/bypass advice.");
      }
    }

    for (const marker of PLACEHOLDER_MARKERS) {
      if (lineText.includes(marker)) {
        pushIssue(issues, "warning", relativePath, line, "placeholder", `Release placeholder still present: ${marker}`);
      }
    }
  });
}

function isSafetyDenial(lineText) {
  return /\b(no|not|do not|does not|must not|without)\b/i.test(lineText) || /(不要|不得|不会|不能|不提供|禁止|拒绝)/.test(lineText);
}

function auditGitMetadata(issues) {
  const output = execFileSync("git", ["log", "--format=%H%x09%an%x09%ae", "--max-count=50"], {
    cwd: ROOT,
    encoding: "utf8",
  });

  output
    .split(/\r?\n/)
    .filter(Boolean)
    .forEach((line) => {
      const [, authorName = "", authorEmail = ""] = line.split("\t");
      if (PRIVATE_PATHS.some((pattern) => pattern.test(`${authorName} ${authorEmail}`))) {
        pushIssue(issues, "error", "(git log)", 0, "git-metadata", "Commit author metadata may contain a private path.");
      }
      if (/(noreply|users\.noreply\.github\.com)$/i.test(authorEmail)) return;
      if (/(localhost|\.local)$/i.test(authorEmail)) {
        pushIssue(issues, "warning", "(git log)", 0, "git-metadata", `Commit author email may be local-only: ${authorEmail}`);
      }
    });
}

function formatIssue(issue) {
  const location = issue.line > 0 ? `${issue.relativePath}:${issue.line}` : issue.relativePath;
  return `${issue.severity.toUpperCase()} ${location} [${issue.category}] ${issue.message}`;
}

function main() {
  const issues = [];

  for (const relativePath of listCandidateFiles()) {
    const text = readText(relativePath);
    if (!text) continue;
    auditText(relativePath, text, issues);
  }

  auditGitMetadata(issues);

  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");

  if (warnings.length) {
    console.warn("Release audit warnings:");
    warnings.forEach((issue) => console.warn(`- ${formatIssue(issue)}`));
  }

  if (errors.length || (STRICT && warnings.length)) {
    const blocking = errors.length ? errors : warnings;
    console.error("Release audit failed:");
    blocking.forEach((issue) => console.error(`- ${formatIssue(issue)}`));
    process.exit(1);
  }

  console.log(`Release audit passed with ${warnings.length} warning${warnings.length === 1 ? "" : "s"}.`);
}

main();
