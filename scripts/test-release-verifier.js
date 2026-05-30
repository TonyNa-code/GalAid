const assert = require("node:assert/strict");
const packageJson = require("../package.json");
const {
  DEFAULT_REPO,
  DEFAULT_TAG,
  buildVerificationSummary,
  findAsset,
  parseArgs,
  parseChecksum,
  readRepositorySlug,
  validateRelease,
  withRetries,
} = require("./verify-release-assets");

const HASH = "c0fa509aca96dd6ef7beeba2de7d1293e146de57bf1203fcca381184910e5a7b";
const COMMIT = "60cafbc936bdbb31f16a78d3fc9da50b4c6ccb98";
const EXE_NAME = `GalAid-${packageJson.version}-win-x64.exe`;
const CHECKSUM_NAME = `${EXE_NAME}.sha256`;
const MANIFEST_NAME = `${EXE_NAME}.release.json`;

async function main() {
  assert.equal(readRepositorySlug(), "TonyNa-code/GalAid");
  assert.equal(DEFAULT_REPO, "TonyNa-code/GalAid");
  assert.equal(DEFAULT_TAG, `v${packageJson.version}-beta`);

  const defaultArgs = { repo: DEFAULT_REPO, tag: DEFAULT_TAG, expectedCommit: "", json: false, retries: 5, retryDelayMs: 1500 };
  assert.deepEqual(parseArgs([]), defaultArgs);
  assert.deepEqual(parseArgs(["v0.1.9-beta"]), { ...defaultArgs, tag: "v0.1.9-beta" });
  assert.deepEqual(parseArgs(["--repo", "Example/GalAid", "--tag", "v1.0.0"]), { ...defaultArgs, repo: "Example/GalAid", tag: "v1.0.0" });
  assert.deepEqual(parseArgs(["--repo=Example/GalAid", "--tag=v1.0.1"]), { ...defaultArgs, repo: "Example/GalAid", tag: "v1.0.1" });
  assert.deepEqual(parseArgs(["v0.1.9-beta", "--commit", COMMIT]), { ...defaultArgs, tag: "v0.1.9-beta", expectedCommit: COMMIT });
  assert.deepEqual(parseArgs(["--tag=v0.1.9-beta", "--expected-commit=" + COMMIT]), { ...defaultArgs, tag: "v0.1.9-beta", expectedCommit: COMMIT });
  assert.deepEqual(parseArgs(["v0.1.9-beta", "--json"]), { ...defaultArgs, tag: "v0.1.9-beta", json: true });
  assert.deepEqual(parseArgs(["--retries", "5", "--retry-delay-ms=0"]), { ...defaultArgs, retries: 5, retryDelayMs: 0 });
  assert.equal(parseArgs(["--help"]).help, true);
  assert.throws(() => parseArgs(["--repo", "missing-slash"]), /Expected --repo/);
  assert.throws(() => parseArgs(["--commit", "short"]), /Expected --commit/);
  assert.throws(() => parseArgs(["--retries", "11"]), /Expected --retries/);
  assert.throws(() => parseArgs(["--retry-delay-ms", "60001"]), /Expected --retry-delay-ms/);
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
      makeAsset(EXE_NAME, 102185013, `sha256:${HASH}`),
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
      size: 102185013,
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

  assert.deepEqual(
    buildVerificationSummary({
      repo: "TonyNa-code/GalAid",
      tag: "v0.1.9-beta",
      exeAsset,
      checksum,
      manifest: {
        ...manifest,
        generatedAt: "2026-05-30T12:42:02.0000000Z",
        workflow: "Desktop Release",
        runId: "26684024904",
        runAttempt: "1",
      },
    }),
    {
      schema: "galaid.releaseVerification.v1",
      repository: "TonyNa-code/GalAid",
      releaseTag: "v0.1.9-beta",
      largeAssetDownloaded: false,
      asset: {
        name: EXE_NAME,
        size: 102185013,
        sha256: HASH,
      },
      manifest: {
        schema: "galaid.windowsReleaseAsset.v1",
        generatedAt: "2026-05-30T12:42:02.0000000Z",
        commit: COMMIT,
        workflow: "Desktop Release",
        runId: "26684024904",
        runAttempt: "1",
      },
    },
  );

  await testRetries();
  console.log("Release verifier smoke passed.");
}

async function testRetries() {
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (message) => warnings.push(String(message));
  let attempts = 0;
  try {
    const result = await withRetries(
      async () => {
        attempts += 1;
        if (attempts < 3) throw new Error("transient release metadata");
        return "ok";
      },
      { retries: 3, delayMs: 0, label: "test retry" },
    );
    assert.equal(result, "ok");
    assert.equal(attempts, 3);

    await assert.rejects(
      () =>
        withRetries(
          async () => {
            throw new Error("still broken");
          },
          { retries: 1, delayMs: 0, label: "test retry" },
        ),
      /still broken/,
    );
  } finally {
    console.warn = originalWarn;
  }

  assert.equal(warnings.length, 3);
  assert.match(warnings[0], /transient release metadata/);
  assert.match(warnings[2], /still broken/);
}

function makeAsset(name, size, digest) {
  return {
    name,
    size,
    digest,
    browser_download_url: `https://example.invalid/${name}`,
  };
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
