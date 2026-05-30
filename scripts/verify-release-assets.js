const https = require("node:https");
const packageJson = require("../package.json");

const DEFAULT_REPO = readRepositorySlug() || "TonyNa-code/GalAid";
const DEFAULT_TAG = `v${packageJson.version}-beta`;
const USER_AGENT = "GalAid release verifier";

function readRepositorySlug() {
  const raw = packageJson.repository?.url || packageJson.homepage || "";
  const match = raw.match(/github\.com[:/]([^/\s]+)\/([^#\s.]+)(?:\.git)?/i);
  return match ? `${match[1]}/${match[2]}` : "";
}

function parseArgs(argv) {
  const options = {
    repo: DEFAULT_REPO,
    tag: DEFAULT_TAG,
    expectedCommit: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--repo") {
      options.repo = argv[(index += 1)] || "";
    } else if (arg.startsWith("--repo=")) {
      options.repo = arg.slice("--repo=".length);
    } else if (arg === "--tag") {
      options.tag = argv[(index += 1)] || "";
    } else if (arg.startsWith("--tag=")) {
      options.tag = arg.slice("--tag=".length);
    } else if (arg === "--commit" || arg === "--expected-commit") {
      options.expectedCommit = argv[(index += 1)] || "";
    } else if (arg.startsWith("--commit=")) {
      options.expectedCommit = arg.slice("--commit=".length);
    } else if (arg.startsWith("--expected-commit=")) {
      options.expectedCommit = arg.slice("--expected-commit=".length);
    } else if (!arg.startsWith("-") && options.tag === DEFAULT_TAG) {
      options.tag = arg;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!/^[^/\s]+\/[^/\s]+$/.test(options.repo)) throw new Error("Expected --repo owner/name.");
  if (!options.tag) throw new Error("Expected a release tag.");
  if (options.expectedCommit && !/^[a-f0-9]{40}$/i.test(options.expectedCommit)) throw new Error("Expected --commit to be a 40-character SHA.");
  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/verify-release-assets.js [tag] [--repo owner/name]

Checks the Windows release sidecars without downloading the large .exe.

Examples:
  node scripts/verify-release-assets.js
  node scripts/verify-release-assets.js v0.1.9-beta
  node scripts/verify-release-assets.js --repo TonyNa-code/GalAid --tag v0.1.9-beta
  node scripts/verify-release-assets.js v0.1.9-beta --commit e3c84de0a6ec2e36f8f78b3ca65b61e576c47042`);
}

function requestText(url, { accept = "application/octet-stream" } = {}) {
  const headers = {
    Accept: accept,
    "User-Agent": USER_AGENT,
  };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
  const hostname = new URL(url).hostname;
  if (token && /(^|\.)github\.com$/i.test(hostname)) headers.Authorization = `Bearer ${token}`;

  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      { headers },
      (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          response.resume();
          requestText(new URL(response.headers.location, url).toString(), { accept }).then(resolve, reject);
          return;
        }

        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(new Error(`GET ${url} failed with ${response.statusCode}: ${body.slice(0, 240)}`));
            return;
          }
          resolve(body);
        });
      },
    );

    request.on("error", reject);
    request.end();
  });
}

async function readRelease(repo, tag) {
  const encodedTag = encodeURIComponent(tag);
  const url = `https://api.github.com/repos/${repo}/releases/tags/${encodedTag}`;
  const body = await requestText(url, { accept: "application/vnd.github+json" });
  return JSON.parse(body);
}

function findAsset(release, name) {
  const asset = release.assets?.find((item) => item.name === name);
  if (!asset) throw new Error(`Release ${release.tag_name} is missing ${name}.`);
  return asset;
}

function parseChecksum(text, checksumName) {
  const line = text.trim().split(/\r?\n/).find(Boolean) || "";
  const match = line.match(/^(?<hash>[a-f0-9]{64})\s+\*?(?<name>.+)$/i);
  if (!match?.groups) throw new Error(`${checksumName} is not a valid SHA-256 sidecar.`);
  return {
    hash: match.groups.hash.toLowerCase(),
    name: match.groups.name.trim(),
  };
}

function pushAssert(errors, condition, message) {
  if (!condition) errors.push(message);
}

function validateRelease({ repo, tag, expectedCommit = "", release, exeAsset, checksumAsset, manifestAsset, checksum, manifest }) {
  const errors = [];

  pushAssert(errors, release.tag_name === tag, `Release tag mismatch: expected ${tag}, got ${release.tag_name}.`);
  pushAssert(errors, manifest.schema === "galaid.windowsReleaseAsset.v1", "Manifest schema mismatch.");
  pushAssert(errors, manifest.repository === repo, `Manifest repository mismatch: expected ${repo}, got ${manifest.repository}.`);
  pushAssert(errors, manifest.releaseTag === tag, `Manifest releaseTag mismatch: expected ${tag}, got ${manifest.releaseTag}.`);
  pushAssert(errors, /^[a-f0-9]{40}$/i.test(manifest.commit || ""), "Manifest commit is not a 40-character SHA.");
  if (expectedCommit) {
    pushAssert(errors, String(manifest.commit).toLowerCase() === expectedCommit.toLowerCase(), `Manifest commit mismatch: expected ${expectedCommit}, got ${manifest.commit}.`);
  }
  pushAssert(errors, manifest.asset?.name === exeAsset.name, `Manifest asset name mismatch: expected ${exeAsset.name}, got ${manifest.asset?.name}.`);
  pushAssert(errors, manifest.asset?.checksumName === checksumAsset.name, `Manifest checksum name mismatch: expected ${checksumAsset.name}, got ${manifest.asset?.checksumName}.`);
  pushAssert(errors, Number(manifest.asset?.size) === Number(exeAsset.size), `Manifest asset size mismatch: expected ${exeAsset.size}, got ${manifest.asset?.size}.`);
  pushAssert(errors, manifest.asset?.sha256 === checksum.hash, "Manifest SHA-256 does not match checksum sidecar.");
  pushAssert(errors, checksum.name === exeAsset.name, `Checksum sidecar filename mismatch: expected ${exeAsset.name}, got ${checksum.name}.`);

  if (exeAsset.digest?.startsWith("sha256:")) {
    pushAssert(errors, exeAsset.digest === `sha256:${checksum.hash}`, "GitHub asset digest does not match checksum sidecar.");
  }

  if (checksumAsset.digest?.startsWith("sha256:")) {
    pushAssert(errors, /^sha256:[a-f0-9]{64}$/i.test(checksumAsset.digest), "Checksum asset digest is malformed.");
  }

  if (manifestAsset.digest?.startsWith("sha256:")) {
    pushAssert(errors, /^sha256:[a-f0-9]{64}$/i.test(manifestAsset.digest), "Manifest asset digest is malformed.");
  }

  if (errors.length) throw new Error(`Release asset verification failed:\n- ${errors.join("\n- ")}`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const exeName = `GalAid-${packageJson.version}-win-x64.exe`;
  const checksumName = `${exeName}.sha256`;
  const manifestName = `${exeName}.release.json`;

  const release = await readRelease(options.repo, options.tag);
  const exeAsset = findAsset(release, exeName);
  const checksumAsset = findAsset(release, checksumName);
  const manifestAsset = findAsset(release, manifestName);

  const checksumText = await requestText(checksumAsset.browser_download_url);
  const manifestText = await requestText(manifestAsset.browser_download_url, { accept: "application/json" });
  const checksum = parseChecksum(checksumText, checksumName);
  const manifest = JSON.parse(manifestText);

  validateRelease({
    repo: options.repo,
    tag: options.tag,
    expectedCommit: options.expectedCommit,
    release,
    exeAsset,
    checksumAsset,
    manifestAsset,
    checksum,
    manifest,
  });

  console.log(`Verified ${options.repo} ${options.tag}`);
  console.log(`- asset: ${exeAsset.name} (${exeAsset.size} bytes)`);
  console.log(`- sha256: ${checksum.hash}`);
  console.log(`- commit: ${manifest.commit}`);
  console.log(`- run: ${manifest.workflow} #${manifest.runId}`);
  console.log("Large .exe download was not required.");
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  DEFAULT_REPO,
  DEFAULT_TAG,
  findAsset,
  parseArgs,
  parseChecksum,
  readRepositorySlug,
  validateRelease,
};
