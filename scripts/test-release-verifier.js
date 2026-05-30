const assert = require("node:assert/strict");
const packageJson = require("../package.json");
const {
  DEFAULT_REPO,
  DEFAULT_TAG,
  findAsset,
  parseArgs,
  parseChecksum,
  readRepositorySlug,
  validateRelease,
} = require("./verify-release-assets");

const HASH = "3226da8562047cfe5c19b0f56e46196d94c64bfe61b88e8c690c70066aa460e2";
const COMMIT = "e3c84de0a6ec2e36f8f78b3ca65b61e576c47042";
const EXE_NAME = `GalAid-${packageJson.version}-win-x64.exe`;
const CHECKSUM_NAME = `${EXE_NAME}.sha256`;
const MANIFEST_NAME = `${EXE_NAME}.release.json`;

function main() {
  assert.equal(readRepositorySlug(), "TonyNa-code/GalAid");
  assert.equal(DEFAULT_REPO, "TonyNa-code/GalAid");
  assert.equal(DEFAULT_TAG, `v${packageJson.version}-beta`);

  assert.deepEqual(parseArgs([]), { repo: DEFAULT_REPO, tag: DEFAULT_TAG, expectedCommit: "" });
  assert.deepEqual(parseArgs(["v0.1.9-beta"]), { repo: DEFAULT_REPO, tag: "v0.1.9-beta", expectedCommit: "" });
  assert.deepEqual(parseArgs(["--repo", "Example/GalAid", "--tag", "v1.0.0"]), { repo: "Example/GalAid", tag: "v1.0.0", expectedCommit: "" });
  assert.deepEqual(parseArgs(["--repo=Example/GalAid", "--tag=v1.0.1"]), { repo: "Example/GalAid", tag: "v1.0.1", expectedCommit: "" });
  assert.deepEqual(parseArgs(["v0.1.9-beta", "--commit", COMMIT]), { repo: DEFAULT_REPO, tag: "v0.1.9-beta", expectedCommit: COMMIT });
  assert.deepEqual(parseArgs(["--tag=v0.1.9-beta", "--expected-commit=" + COMMIT]), { repo: DEFAULT_REPO, tag: "v0.1.9-beta", expectedCommit: COMMIT });
  assert.equal(parseArgs(["--help"]).help, true);
  assert.throws(() => parseArgs(["--repo", "missing-slash"]), /Expected --repo/);
  assert.throws(() => parseArgs(["--commit", "short"]), /Expected --commit/);
  assert.throws(() => parseArgs(["--unknown"]), /Unknown argument/);

  assert.deepEqual(parseChecksum(`${HASH}  ${EXE_NAME}\r\n`, CHECKSUM_NAME), {
    hash: HASH,
    name: EXE_NAME,
  });
  assert.deepEqual(parseChecksum(`${HASH} *${EXE_NAME}\n`, CHECKSUM_NAME), {
    hash: HASH,
    name: EXE_NAME,
  });
  assert.throws(() => parseChecksum("not-a-checksum", CHECKSUM_NAME), /valid SHA-256 sidecar/);

  const release = {
    tag_name: "v0.1.9-beta",
    assets: [
      makeAsset(EXE_NAME, 102185022, `sha256:${HASH}`),
      makeAsset(CHECKSUM_NAME, 92, "sha256:5dc6bed48e98037f6894bd13cccfe7fce83ede16ad949aecdb15303bae0bd78f"),
      makeAsset(MANIFEST_NAME, 557, "sha256:4dfc95d7223865f8762c868ddb528229e0fe78c35776db0c3097545dae2d7bee"),
    ],
  };

  const exeAsset = findAsset(release, EXE_NAME);
  const checksumAsset = findAsset(release, CHECKSUM_NAME);
  const manifestAsset = findAsset(release, MANIFEST_NAME);
  const checksum = { hash: HASH, name: EXE_NAME };
  const manifest = {
    schema: "galaid.windowsReleaseAsset.v1",
    repository: "TonyNa-code/GalAid",
    releaseTag: "v0.1.9-beta",
    commit: COMMIT,
    asset: {
      name: EXE_NAME,
      size: 102185022,
      sha256: HASH,
      checksumName: CHECKSUM_NAME,
    },
  };

  assert.doesNotThrow(() =>
    validateRelease({
      repo: "TonyNa-code/GalAid",
      tag: "v0.1.9-beta",
      expectedCommit: COMMIT,
      release,
      exeAsset,
      checksumAsset,
      manifestAsset,
      checksum,
      manifest,
    }),
  );

  assert.throws(
    () =>
      validateRelease({
        repo: "TonyNa-code/GalAid",
        tag: "v0.1.9-beta",
        expectedCommit: "0".repeat(40),
        release,
        exeAsset,
        checksumAsset,
        manifestAsset,
        checksum,
        manifest,
      }),
    /Manifest commit mismatch/,
  );
  assert.throws(
    () =>
      validateRelease({
        repo: "TonyNa-code/GalAid",
        tag: "v0.1.9-beta",
        release,
        exeAsset,
        checksumAsset,
        manifestAsset,
        checksum,
        manifest: { ...manifest, asset: { ...manifest.asset, sha256: "0".repeat(64) } },
      }),
    /Manifest SHA-256 does not match checksum sidecar/,
  );
  assert.throws(() => findAsset(release, "missing.exe"), /is missing missing\.exe/);

  console.log("Release verifier smoke passed.");
}

function makeAsset(name, size, digest) {
  return {
    name,
    size,
    digest,
    browser_download_url: `https://example.invalid/${name}`,
  };
}

main();
