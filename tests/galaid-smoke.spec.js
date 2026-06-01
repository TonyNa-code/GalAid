const { test, expect } = require("@playwright/test");

function makeWindowsUserPath(...parts) {
  return ["C:", "Users", "Alice", ...parts].join("\\");
}

function makeMacUserPath(...parts) {
  return ["", "Users", "alice", ...parts].join("/");
}

test("sample diagnosis renders roadmap and support bundle metadata", async ({ page }) => {
  const privateWinPath = makeWindowsUserPath("Downloads", "SakuraTrial", "game.exe");
  const privateMacPath = makeMacUserPath("Games", "SakuraTrial", "game.exe");

  await page.goto("/");

  await expect(page).toHaveTitle(/GalAid/);
  await expect(page.locator("#launchPanel .empty-flow")).toContainText("拖进来");
  await expect(page.locator("#launchPanel .empty-flow")).toContainText("一键启动");
  await page.getByRole("button", { name: "游戏样例" }).click();
  await page
    .locator("#errorInput")
    .fill(`The program cannot start because d3dx9_43.dll is missing. VCRUNTIME140.dll was not found. Tried ${privateWinPath} and ${privateMacPath}.`);
  await page.locator('[data-tab="roadmap"]').click();

  await expect(page.locator("#projectTitle")).toHaveText("SakuraTrial");
  await expect(page.locator(".roadmap-summary h4")).toHaveText("5 个建议步骤");
  await expect(page.locator(".roadmap-step h4").filter({ hasText: "包内运行库/修复工具" })).toBeVisible();
  await expect(page.locator(".roadmap-step h4").filter({ hasText: "DirectX 旧组件" })).toBeVisible();
  await expect(page.locator(".roadmap-step h4").filter({ hasText: "VC++ 运行库" })).toBeVisible();
  await expect(page.locator(".roadmap-list")).toContainText("VC++: SakuraTrial/vcredist_x86.exe");
  await page.locator('[data-tab="launch"]').click();
  await expect(page.getByRole("heading", { name: "一站式启动向导" })).toBeVisible();
  await expect(page.locator(".one-stop-wizard")).toContainText("推荐优先尝试");
  await expect(page.locator("#launchPanel .finding-evidence").first()).toContainText("判断依据");
  await expect(page.locator("#launchPanel .finding-evidence").first()).toContainText("SakuraTrial/game.exe");
  await expect(page.getByRole("heading", { name: "运行库修复工具" })).toBeVisible();
  await expect(page.locator(".repair-tool-card")).toContainText("vcredist_x86.exe");
  await expect(page.locator(".repair-tool-card")).toContainText("当前报错相关");
  await page.locator('[data-tab="profiles"]').click();
  await expect(page.locator("#profilesPanel")).toContainText("可选启动模板");
  await expect(page.locator("#profilesPanel")).toContainText("Locale Emulator");
  await expect(page.locator("#profilesPanel")).toContainText("Wine Japanese locale");
  await expect(page.locator("#profilesPanel")).toContainText("Proton / Steam Deck");
  await expect(page.locator("#profilesPanel")).toContainText("LEProc.exe");

  const recipeCount = await page.evaluate(() => window.GALAID_ERROR_RECIPES.length);
  expect(recipeCount).toBeGreaterThanOrEqual(11);

  await page.locator('[data-tab="support"]').click();
  await expect(page.getByRole("heading", { name: "求助包" })).toBeVisible();
  await expect(page.getByRole("button", { name: "复制 QQ 求助文案" })).toBeVisible();
  await expect(page.locator(".support-file-list")).toContainText("roadmap.json");
  await expect(page.locator(".support-file-list")).toContainText("roadmap-checklist.md");
  await expect(page.locator(".support-file-list")).toContainText("runtime-repairs.json");
  await expect(page.locator(".support-file-list")).toContainText("launch-decision.md");
  await expect(page.locator(".support-file-list")).toContainText("launch-decision.json");
  await expect(page.locator(".support-file-list")).toContainText("file-manifest.json");
  await expect(page.locator(".support-file-list")).toContainText("privacy-summary.md");
  await expect(page.locator(".support-file-list")).toContainText("privacy-summary.json");
  await expect(page.locator(".support-file-list")).toContainText("package-previews.md");
  await expect(page.locator(".support-file-list")).toContainText("package-previews.json");
  await expect(page.locator("#supportPanel")).toContainText("诊断摘要");

  const supportPreview = page.locator(".support-preview");
  await expect(supportPreview).toContainText("## GalAid 求助摘要");
  await expect(supportPreview).toContainText("SakuraTrial");
  await expect(supportPreview).toContainText("DirectX 旧组件");

  const chatHelp = await page.evaluate(() => buildChatHelpText(currentAnalysis, "zh-CN"));
  expect(chatHelp).toContain("我在 GalAid 里扫了一下这个 galgame");
  expect(chatHelp).toContain("SakuraTrial/game.exe");
  expect(chatHelp).toContain("DirectX 旧组件");

  const supportEntries = await page.evaluate(() => buildSupportBundle(currentAnalysis, errorInput.value, "zh-CN").entries.map((entry) => entry.path));
  expect(supportEntries).toContain("runtime-repairs.json");
  expect(supportEntries).toContain("launch-decision.md");
  expect(supportEntries).toContain("launch-decision.json");
  expect(supportEntries).toContain("privacy-summary.md");
  expect(supportEntries).toContain("privacy-summary.json");
  expect(supportEntries).toContain("package-previews.md");
  expect(supportEntries).toContain("package-previews.json");

  const launchDecisionSupport = await page.evaluate(() => {
    const bundle = buildSupportBundle(currentAnalysis, errorInput.value, "zh-CN");
    return {
      json: JSON.parse(bundle.entries.find((item) => item.path === "launch-decision.json").content),
      markdown: bundle.entries.find((item) => item.path === "launch-decision.md").content,
    };
  });
  expect(launchDecisionSupport.json.schema).toBe("galaid.launchDecision.v1");
  expect(launchDecisionSupport.json.primaryAction.type).toBe("runtime-repair");
  expect(launchDecisionSupport.json.primaryAction.path).toBe("SakuraTrial/vcredist_x86.exe");
  expect(launchDecisionSupport.json.launchCandidates[0].path).toBe("SakuraTrial/game.exe");
  expect(launchDecisionSupport.markdown).toContain("# 启动决策摘要");
  expect(launchDecisionSupport.markdown).toContain("SakuraTrial/game.exe");
  expect(launchDecisionSupport.markdown).toContain("SakuraTrial/vcredist_x86.exe");

  const privacySupport = await page.evaluate(() => {
    const bundle = buildSupportBundle(currentAnalysis, errorInput.value, "zh-CN");
    return {
      json: JSON.parse(bundle.entries.find((item) => item.path === "privacy-summary.json").content),
      markdown: bundle.entries.find((item) => item.path === "privacy-summary.md").content,
      manifest: JSON.parse(bundle.entries.find((item) => item.path === "manifest.json").content),
    };
  });
  expect(privacySupport.json.schema).toBe("galaid.privacySummary.v1");
  expect(privacySupport.json.totalRedactions).toBeGreaterThanOrEqual(2);
  expect(privacySupport.json.entries.some((entry) => entry.path === "galaid-report.md")).toBe(true);
  expect(privacySupport.json.entries.some((entry) => entry.path === "error-text.txt")).toBe(true);
  expect(privacySupport.markdown).toContain("# 求助包隐私摘要");
  expect(privacySupport.markdown).toContain("[absolute-path]");
  expect(privacySupport.manifest.summary.redactedAbsolutePathMentions).toBe(privacySupport.json.totalRedactions);
  expect(privacySupport.manifest.summary.redactedSupportFiles).toBe(privacySupport.json.filesWithRedactions);

  const shareableSupportText = await page.evaluate(() => {
    const bundle = buildSupportBundle(currentAnalysis, errorInput.value, "zh-CN");
    return bundle.entries.map((entry) => `${entry.path}\n${entry.content}`).join("\n---\n");
  });
  expect(shareableSupportText).toContain("[absolute-path]");
  expect(shareableSupportText).not.toContain(privateWinPath);
  expect(shareableSupportText).not.toContain(privateMacPath);
});

test("DirectX legacy recipe keeps exact DLL evidence narrow", async ({ page }) => {
  await page.goto("/");

  const recipeMatches = await page.evaluate(() => {
    const examples = [
      "The program cannot start because XINPUT1_3.dll is missing.",
      "Cannot load XAudio2_7.dll.",
      "XAPOFX1_5.dll was not found.",
      "X3DAudio1_7.dll missing.",
      "XACTEngine3_7.dll not found.",
      "D3DCompiler_43.dll is missing.",
      "DDRAW.dll was not found.",
      "D3DRM.dll is missing.",
      "DirectDraw initialization failed.",
    ];

    return {
      positives: examples.map((text) => buildErrorDiagnostics(text).matches.map((match) => match.id)),
      broadRendererFailure: buildErrorDiagnostics("Failed to initialize renderer: d3d11.dll").matches.map((match) => match.id),
    };
  });

  for (const matches of recipeMatches.positives) {
    expect(matches).toContain("directx-legacy");
  }
  expect(recipeMatches.broadRendererFailure).not.toContain("directx-legacy");
});

test("DirectPlay recipe and import hints route old Windows component guidance", async ({ page }) => {
  await page.goto("/");

  const result = await page.evaluate(() => {
    const analysis = analyze(
      [
        {
          name: "OldNetworkVN.exe",
          path: "OldNetworkVN/OldNetworkVN.exe",
          lowerPath: "oldnetworkvn/oldnetworkvn.exe",
          ext: "exe",
          size: 1024,
          depth: 1,
          executableInfo: {
            runtime: "win32",
            runtimeImports: ["dplayx.dll", "dpnet.dll"],
            importHints: ["legacy-directplay"],
          },
        },
      ],
      "DirectPlay is required. dplayx.dll was not found.",
    );
    return {
      matches: analysis.errorDiagnostics.matches.map((match) => match.id),
      directPlayCheck: analysis.environment.checks.find((check) => check.id === "directplay"),
      directXCheck: analysis.environment.checks.find((check) => check.id === "directx"),
      roadmapIds: analysis.roadmap.steps.map((step) => step.id),
    };
  });

  expect(result.matches).toContain("directplay-legacy");
  expect(result.matches).not.toContain("directx-legacy");
  expect(result.directPlayCheck.status).toBe("warning");
  expect(result.directPlayCheck.evidence.join(" ")).toContain("dplayx.dll");
  expect(result.directXCheck.status).toBe("info");
  expect(result.roadmapIds).toContain("error-directplay-legacy");
});

test("old video component recipe covers DirectShow, MCI, and codec clues", async ({ page }) => {
  await page.goto("/");

  const recipeMatches = await page.evaluate(() => {
    const examples = [
      "mciqtz32.dll failed to load.",
      "mciavi32.dll was not found.",
      "Cannot initialize quartz.dll.",
      "IR50_32.DLL is missing.",
      "Indeo video codec is required.",
      "Video for Windows codec failed.",
    ];

    return examples.map((text) => buildErrorDiagnostics(text).matches.map((match) => match.id));
  });

  for (const matches of recipeMatches) {
    expect(matches).toContain("quicktime-runtime");
  }
});

test("Flash, VB ActiveX, and Borland runtime recipes stay narrow", async ({ page }) => {
  await page.goto("/");

  const result = await page.evaluate(() => {
    const flashExamples = [
      "flash.ocx failed to load.",
      "Flash9.ocx is missing.",
      "Shockwave Flash object could not be created.",
    ];
    const activexExamples = [
      "MSCOMCTL.OCX was not correctly registered.",
      "COMDLG32.OCX is missing or invalid.",
      "TABCTL32.OCX could not be loaded.",
      "ActiveX component can't create object.",
    ];
    const borlandExamples = [
      "borlndmm.dll was not found.",
      "cc3260mt.dll failed to load.",
      "rtl60.bpl is missing.",
      "vcljpg70.bpl could not be found.",
    ];

    return {
      flash: flashExamples.map((text) => buildErrorDiagnostics(text).matches.map((match) => match.id)),
      activex: activexExamples.map((text) => buildErrorDiagnostics(text).matches.map((match) => match.id)),
      borland: borlandExamples.map((text) => buildErrorDiagnostics(text).matches.map((match) => match.id)),
      genericFlash: buildErrorDiagnostics("The intro movie flashes and then closes.").matches.map((match) => match.id),
      genericActiveX: buildErrorDiagnostics("The article mentions ActiveX history.").matches.map((match) => match.id),
      genericDelphi: buildErrorDiagnostics("This post mentions Delphi as trivia.").matches.map((match) => match.id),
    };
  });

  for (const matches of result.flash) {
    expect(matches).toContain("activex-flash-runtime");
  }
  for (const matches of result.activex) {
    expect(matches).toContain("vb-activex-controls");
    expect(matches).not.toContain("activex-flash-runtime");
  }
  for (const matches of result.borland) {
    expect(matches).toContain("borland-delphi-runtime");
  }
  expect(result.genericFlash).not.toContain("activex-flash-runtime");
  expect(result.genericActiveX).not.toContain("vb-activex-controls");
  expect(result.genericDelphi).not.toContain("borland-delphi-runtime");
});

test("ADO DAO and Jet database runtime recipe stays narrow", async ({ page }) => {
  await page.goto("/");

  const result = await page.evaluate(() => {
    const examples = [
      "DAO360.DLL was not found.",
      "MSADO15.DLL failed to load.",
      "MSJET40.DLL is missing.",
      "Microsoft.Jet.OLEDB.4.0 provider is not registered.",
      "ADODB.Connection cannot be created.",
    ];

    return {
      positives: examples.map((text) => buildErrorDiagnostics(text).matches.map((match) => match.id)),
      genericDatabase: buildErrorDiagnostics("The menu stores settings in a database file.").matches.map((match) => match.id),
      genericProvider: buildErrorDiagnostics("The provider returned an unknown error.").matches.map((match) => match.id),
    };
  });

  for (const matches of result.positives) {
    expect(matches).toContain("database-ado-jet-runtime");
  }
  expect(result.genericDatabase).not.toContain("database-ado-jet-runtime");
  expect(result.genericProvider).not.toContain("database-ado-jet-runtime");
});

test("package sample shows archive and image preflight without treating it as runnable", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "包/镜像样例" }).click();
  await page.locator('[data-tab="packages"]').click();

  const packagesPanel = page.locator("#packagesPanel");
  await expect(packagesPanel).toContainText("ZIP 目录预检");
  await expect(packagesPanel).toContainText("SnowTrial/Game.exe");
  await expect(packagesPanel).toContainText("DXSETUP.exe");
  await expect(packagesPanel).toContainText("运行库修复项");
  await expect(packagesPanel).toContainText("KiriKiri / 吉里吉里");
  await expect(packagesPanel).toContainText("RAR 包/镜像预检");
  await expect(packagesPanel).toContainText("MoonlightCafe/Game.exe");
  await expect(packagesPanel).toContainText("ISO disc image 包/镜像预检");
  await expect(packagesPanel).toContainText("MoonlightCafe_Bonus/Game.exe");
  await expect(packagesPanel).toContainText("CCD/IMG disc image");
  await expect(packagesPanel).toContainText("MDS/MDF disc image");
  await expect(packagesPanel).toContainText("BlindWrite 6 disc image");
  await expect(packagesPanel).toContainText("古早镜像已识别");
  await expect(page.locator(".package-roadmap")).toContainText("包里看到启动线索");
  await expect(page.locator(".package-roadmap")).toContainText("包内有运行库修复项");
  await expect(page.locator(".package-roadmap")).toContainText("识别到古早镜像格式");
  await expect(page.locator("main")).toContainText("Blocked");

  const archiveGrouping = await page.evaluate(() => {
    const files = [
      { name: "ClassicVN.zip", path: "ClassicVN.zip", lowerPath: "classicvn.zip", ext: "zip", size: 1000, depth: 0 },
      { name: "ClassicVN.z01", path: "ClassicVN.z01", lowerPath: "classicvn.z01", ext: "z01", size: 1000, depth: 0 },
      { name: "OldGame.lzh", path: "OldGame.lzh", lowerPath: "oldgame.lzh", ext: "lzh", size: 1000, depth: 0 },
    ];
    return analyze(files, "").packages.archiveSets.map((set) => ({
      format: set.format,
      firstFile: set.firstFile.path,
      missing: set.missing,
      level: set.level,
    }));
  });
  expect(archiveGrouping).toEqual([
    { format: "ZIP archive", firstFile: "ClassicVN.zip", missing: [], level: "good" },
    { format: "LZH archive", firstFile: "OldGame.lzh", missing: [], level: "info" },
  ]);

  await page.locator('[data-tab="roadmap"]').click();
  await expect(page.locator(".roadmap-step").first()).toContainText("先处理压缩包或镜像");
  await expect(page.locator(".roadmap-step").first()).toContainText("解压/挂载并重扫");

  await page.locator('[data-tab="support"]').click();
  await expect(page.locator(".support-file-list")).toContainText("file-manifest.json");
  await expect(page.locator(".support-file-list")).toContainText("privacy-summary.md");
  await expect(page.locator(".support-file-list")).toContainText("privacy-summary.json");
  await expect(page.locator(".support-file-list")).toContainText("launch-decision.md");
  await expect(page.locator(".support-file-list")).toContainText("launch-decision.json");
  await expect(page.locator(".support-file-list")).toContainText("package-previews.md");
  await expect(page.locator(".support-file-list")).toContainText("package-previews.json");

  const packagePreviewSupport = await page.evaluate(() => {
    const bundle = buildSupportBundle(currentAnalysis, "", "zh-CN");
    return {
      json: JSON.parse(bundle.entries.find((item) => item.path === "package-previews.json").content),
      markdown: bundle.entries.find((item) => item.path === "package-previews.md").content,
    };
  });
  expect(packagePreviewSupport.json.schema).toBe("galaid.packagePreviews.v1");
  expect(packagePreviewSupport.json.count).toBeGreaterThanOrEqual(3);
  expect(packagePreviewSupport.json.launchClueCount).toBeGreaterThanOrEqual(1);
  expect(packagePreviewSupport.json.installerClueCount).toBeGreaterThanOrEqual(1);
  expect(packagePreviewSupport.json.runtimeRepairClueCount).toBeGreaterThanOrEqual(1);
  expect(packagePreviewSupport.json.entries.some((entry) => entry.launchSamples.includes("SnowTrial/Game.exe"))).toBe(true);
  expect(packagePreviewSupport.markdown).toContain("# 包/镜像预检摘要");
  expect(packagePreviewSupport.markdown).toContain("SnowTrial/Game.exe");
  expect(packagePreviewSupport.markdown).toContain("DXSETUP.exe");

  await page.locator("#assistantLanguageSelect").selectOption("en");
  await page.locator('[data-tab="report"]').click();
  await expect(page.locator("#reportPanel")).toContainText("## Next-step roadmap");

  await page.locator('[data-tab="launch"]').click();
  await expect(page.locator(".one-stop-wizard")).toContainText("Handle packages/images");
  await expect(page.getByRole("heading", { name: "No launch candidate" })).toBeVisible();
});

test("self-extracting EXE packages prepare before launch", async ({ page }) => {
  await page.addInitScript(() => {
    window.galaidDesktop = {
      platform: "win32",
      selectFolder: async () => ({ canceled: true, files: [] }),
      selectFiles: async () => ({ canceled: true, files: [] }),
      scanPaths: async () => ({ canceled: true, files: [] }),
      preparePackage: async () => ({ ok: false, errorCode: "canceled" }),
      launchEntry: async () => ({ ok: true }),
      getLaunchHistory: async () => [],
      onScanProgress: () => () => {},
      onPrepareProgress: () => () => {},
      onOcrProgress: () => () => {},
    };
  });
  await page.goto("/");

  await page.evaluate(async () => {
    await setFiles([
      {
        name: "DownloadPackage.exe",
        path: "DownloadPackage.exe",
        lowerPath: "downloadpackage.exe",
        ext: "exe",
        size: 520000000,
        depth: 0,
        fullPath: "C:\\Downloads\\DownloadPackage.exe",
        archivePreview: {
          schema: "galaid.archivePreview.v1",
          format: "Self-extracting EXE",
          packageKind: "self-extracting-archive",
          status: "ok",
          totalEntries: 2,
          scannedEntries: 2,
          fileCount: 2,
          directoryCount: 0,
          encryptedEntries: 0,
          truncated: false,
          warnings: ["Self-extracting EXE package detected; prepare it like an archive before launching the extracted game."],
          sampleFiles: [
            { path: "DownloadPackage/Game.exe", name: "Game.exe", ext: "exe", size: 1422000, compressedSize: 980000, depth: 1 },
            { path: "DownloadPackage/data.xp3", name: "data.xp3", ext: "xp3", size: 420000000, compressedSize: 380000000, depth: 1 },
          ],
          signals: {
            launchCandidateCount: 1,
            launchSamples: ["DownloadPackage/Game.exe"],
            installerCount: 0,
            installerSamples: [],
            runtimeRepairCount: 0,
            runtimeRepairSamples: [],
            engineHints: [{ id: "kirikiri", name: "KiriKiri / 吉里吉里", count: 1, samples: ["DownloadPackage/data.xp3"] }],
            assetCounts: {
              images: 0,
              audio: 0,
              video: 0,
              scripts: 0,
              resourceArchives: 1,
              commercialArchives: 0,
            },
          },
        },
      },
    ]);
  });

  await page.locator('[data-tab="packages"]').click();
  await expect(page.locator("#packagesPanel")).toContainText("Self-extracting EXE archive");
  await expect(page.locator("#packagesPanel")).toContainText("DownloadPackage/Game.exe");
  await expect(page.locator("#packagesPanel")).toContainText("解压并重扫");
  await page.locator('[data-tab="launch"]').click();
  await expect(page.locator(".one-stop-wizard")).toContainText("一键准备并启动");

  const result = await page.evaluate(() => ({
    launchCandidates: currentAnalysis.launchCandidates.map((candidate) => candidate.file.path),
    archiveFormat: currentAnalysis.packages.archiveSets[0]?.format,
    roadmapId: currentAnalysis.roadmap.steps[0]?.id,
  }));
  expect(result.launchCandidates).toEqual([]);
  expect(result.archiveFormat).toBe("Self-extracting EXE archive");
  expect(result.roadmapId).toBe("extract-first");
});

test("CUE sheets group referenced BIN tracks as one disc image", async ({ page }) => {
  await page.goto("/");

  const result = await page.evaluate(() => {
    const complete = analyze([
      {
        name: "MoonlightCafe.cue",
        path: "Disc/MoonlightCafe.cue",
        lowerPath: "disc/moonlightcafe.cue",
        ext: "cue",
        size: 128,
        depth: 1,
        fullPath: "C:\\Downloads\\Disc\\MoonlightCafe.cue",
        textPreview: 'FILE "Track01.bin" BINARY\n  TRACK 01 MODE1/2352\nFILE "Track02.bin" BINARY\n  TRACK 02 AUDIO\n',
      },
      {
        name: "Track01.bin",
        path: "Disc/Track01.bin",
        lowerPath: "disc/track01.bin",
        ext: "bin",
        size: 734000000,
        depth: 1,
        fullPath: "C:\\Downloads\\Disc\\Track01.bin",
      },
      {
        name: "Track02.bin",
        path: "Disc/Track02.bin",
        lowerPath: "disc/track02.bin",
        ext: "bin",
        size: 42000000,
        depth: 1,
        fullPath: "C:\\Downloads\\Disc\\Track02.bin",
      },
    ]);
    const missing = analyze([
      {
        name: "MoonlightCafe.cue",
        path: "Disc/MoonlightCafe.cue",
        lowerPath: "disc/moonlightcafe.cue",
        ext: "cue",
        size: 128,
        depth: 1,
        fullPath: "C:\\Downloads\\Disc\\MoonlightCafe.cue",
        textPreview: 'FILE "Track01.bin" BINARY\n  TRACK 01 MODE1/2352\n',
      },
    ]);
    return {
      completeSetCount: complete.packages.discSets.length,
      completeFormat: complete.packages.discSets[0]?.format,
      completeLevel: complete.packages.discSets[0]?.level,
      completeSummary: complete.packages.discSets[0]?.summary,
      completeFiles: complete.packages.discSets[0]?.files.map((item) => item.file.path),
      missingLevel: missing.packages.discSets[0]?.level,
      missingSummary: missing.packages.discSets[0]?.summary,
      missingRoadmapId: missing.roadmap.steps[0]?.id,
    };
  });

  expect(result.completeSetCount).toBe(1);
  expect(result.completeFormat).toBe("CUE/BIN disc image");
  expect(result.completeLevel).toBe("info");
  expect(result.completeSummary).toContain("track01.bin");
  expect(result.completeFiles).toEqual(["Disc/MoonlightCafe.cue", "Disc/Track01.bin", "Disc/Track02.bin"]);
  expect(result.missingLevel).toBe("warning");
  expect(result.missingSummary).toContain("track01.bin");
  expect(result.missingRoadmapId).toBe("extract-first");
});

test("disc image directory preflight exposes internal launch clues", async ({ page }) => {
  await page.addInitScript(() => {
    window.galaidDesktop = {
      platform: "win32",
      selectFolder: async () => ({ canceled: true, files: [] }),
      selectFiles: async () => ({ canceled: true, files: [] }),
      scanPaths: async () => ({ canceled: true, files: [] }),
      preparePackage: async () => ({ ok: false, errorCode: "canceled" }),
      launchEntry: async () => ({ ok: true }),
      getLaunchHistory: async () => [],
      onScanProgress: () => () => {},
      onPrepareProgress: () => () => {},
      onOcrProgress: () => () => {},
    };
  });
  await page.goto("/");

  await page.evaluate(async () => {
    await setFiles([
      {
        name: "InstallDisc.iso",
        path: "InstallDisc.iso",
        lowerPath: "installdisc.iso",
        ext: "iso",
        size: 950000000,
        depth: 0,
        fullPath: "C:\\Downloads\\InstallDisc.iso",
        archivePreview: {
          schema: "galaid.archivePreview.v1",
          format: "ISO disc image",
          packageKind: "disc-image",
          status: "ok",
          totalEntries: 3,
          scannedEntries: 3,
          fileCount: 3,
          directoryCount: 0,
          encryptedEntries: 0,
          truncated: false,
          warnings: ["Disc image directory listed with a local 7z-compatible command; no files were extracted."],
          sampleFiles: [
            { path: "Install/SetupJP.exe", name: "SetupJP.exe", ext: "exe", size: 2412000, compressedSize: 2412000, depth: 1 },
            { path: "Game/Game.exe", name: "Game.exe", ext: "exe", size: 1422000, compressedSize: 1422000, depth: 1 },
            { path: "Game/data.xp3", name: "data.xp3", ext: "xp3", size: 420000000, compressedSize: 420000000, depth: 1 },
          ],
          signals: {
            launchCandidateCount: 1,
            launchSamples: ["Game/Game.exe"],
            installerCount: 1,
            installerSamples: ["Install/SetupJP.exe"],
            runtimeRepairCount: 0,
            runtimeRepairSamples: [],
            engineHints: [{ id: "kirikiri", name: "KiriKiri / 吉里吉里", count: 1, samples: ["Game/data.xp3"] }],
            assetCounts: {
              images: 0,
              audio: 0,
              video: 0,
              scripts: 0,
              resourceArchives: 1,
              commercialArchives: 0,
            },
          },
        },
      },
    ]);
  });

  await page.locator('[data-tab="packages"]').click();
  await expect(page.locator("#packagesPanel")).toContainText("ISO disc image 包/镜像预检");
  await expect(page.locator("#packagesPanel")).toContainText("Game/Game.exe");
  await expect(page.locator("#packagesPanel")).toContainText("Install/SetupJP.exe");
  await expect(page.locator("#packagesPanel")).toContainText("挂载/解包并重扫");
  await expect(page.locator(".package-roadmap")).toContainText("包里看到启动线索");

  await page.locator('[data-tab="launch"]').click();
  await expect(page.locator(".one-stop-wizard")).toContainText("一键准备并启动");

  const result = await page.evaluate(() => ({
    launchCandidates: currentAnalysis.launchCandidates.map((candidate) => candidate.file.path),
    nextStep: currentAnalysis.packages.discSets[0]?.nextStep,
    preparePath: getOneClickPrepareTarget(currentAnalysis)?.file?.path,
  }));
  expect(result.launchCandidates).toEqual([]);
  expect(result.nextStep).toContain("Game/Game.exe");
  expect(result.preparePath).toBe("InstallDisc.iso");
});

test("autorun disc image preflight treats start stubs as install media", async ({ page }) => {
  await page.addInitScript(() => {
    window.galaidDesktop = {
      platform: "win32",
      selectFolder: async () => ({ canceled: true, files: [] }),
      selectFiles: async () => ({ canceled: true, files: [] }),
      scanPaths: async () => ({ canceled: true, files: [] }),
      preparePackage: async () => ({ ok: false, errorCode: "canceled" }),
      launchEntry: async () => ({ ok: true }),
      getLaunchHistory: async () => [],
      onScanProgress: () => () => {},
      onPrepareProgress: () => () => {},
      onOcrProgress: () => () => {},
    };
  });
  await page.goto("/");

  await page.evaluate(async () => {
    await setFiles([
      {
        name: "InstallDisc.iso",
        path: "InstallDisc.iso",
        lowerPath: "installdisc.iso",
        ext: "iso",
        size: 950000000,
        depth: 0,
        fullPath: "C:\\Downloads\\InstallDisc.iso",
        archivePreview: {
          schema: "galaid.archivePreview.v1",
          format: "ISO disc image",
          packageKind: "disc-image",
          status: "ok",
          totalEntries: 3,
          scannedEntries: 3,
          fileCount: 3,
          directoryCount: 0,
          encryptedEntries: 0,
          truncated: false,
          warnings: [
            "Disc image directory listed with a local 7z-compatible command; no files were extracted.",
            "Autorun/install-media layout detected; likely autorun stubs are treated as installer entries.",
          ],
          sampleFiles: [
            { path: "autorun.inf", name: "autorun.inf", ext: "inf", size: 120, compressedSize: 120, depth: 0 },
            { path: "Start.exe", name: "Start.exe", ext: "exe", size: 2412000, compressedSize: 2412000, depth: 0 },
            { path: "data1.cab", name: "data1.cab", ext: "cab", size: 760000000, compressedSize: 760000000, depth: 0 },
          ],
          signals: {
            launchCandidateCount: 0,
            launchSamples: [],
            installerCount: 3,
            installerSamples: ["Start.exe", "autorun.inf", "data1.cab"],
            runtimeRepairCount: 0,
            runtimeRepairSamples: [],
            engineHints: [],
            assetCounts: {
              images: 0,
              audio: 0,
              video: 0,
              scripts: 0,
              resourceArchives: 0,
              commercialArchives: 0,
            },
          },
        },
      },
    ]);
  });

  await page.locator('[data-tab="packages"]').click();
  await expect(page.locator("#packagesPanel")).toContainText("ISO disc image 包/镜像预检");
  await expect(page.locator("#packagesPanel")).toContainText("Start.exe");
  await expect(page.locator("#packagesPanel")).toContainText("3 安装线索");
  await expect(page.locator(".archive-signal-list")).toContainText("安装线索");
  await expect(page.locator(".archive-signal-list")).toContainText("Start.exe");
  await expect(page.locator(".package-roadmap")).toContainText("看到古早安装盘线索");
  await expect(page.locator(".package-roadmap")).not.toContainText("包里看到启动线索");

  await page.locator('[data-tab="launch"]').click();
  await expect(page.locator(".one-stop-wizard")).toContainText("一键准备并启动");

  const result = await page.evaluate(() => ({
    launchCandidates: currentAnalysis.launchCandidates.map((candidate) => candidate.file.path),
    launchCount: currentAnalysis.packages.discSets[0]?.archivePreview?.signals?.launchCandidateCount,
    installerSamples: currentAnalysis.packages.discSets[0]?.archivePreview?.signals?.installerSamples,
    nextStep: currentAnalysis.packages.discSets[0]?.nextStep,
    preparePath: getOneClickPrepareTarget(currentAnalysis)?.file?.path,
    manifestPackagePreviews: JSON.parse(buildSupportBundle(currentAnalysis, "", "zh-CN").entries.find((entry) => entry.path === "file-manifest.json").content).packagePreviews,
  }));
  expect(result.launchCandidates).toEqual([]);
  expect(result.launchCount).toBe(0);
  expect(result.installerSamples).toEqual(["Start.exe", "autorun.inf", "data1.cab"]);
  expect(result.nextStep).toContain("Start.exe");
  expect(result.preparePath).toBe("InstallDisc.iso");
  expect(result.manifestPackagePreviews[0].packageType).toBe("disc");
  expect(result.manifestPackagePreviews[0].installerSamples).toEqual(["Start.exe", "autorun.inf", "data1.cab"]);
});

test("desktop one-click flow prepares a package automatically before launch", async ({ page }) => {
  await page.addInitScript(() => {
    window.__preparePayloads = [];
    window.__launchPayloads = [];
    window.galaidDesktop = {
      platform: "win32",
      selectFolder: async () => ({ canceled: true, files: [] }),
      selectFiles: async () => ({ canceled: true, files: [] }),
      scanPaths: async () => ({ canceled: true, files: [] }),
      preparePackage: async (payload) => {
        window.__preparePayloads.push(payload);
        return {
          ok: true,
          files: [
            {
              name: "Game.exe",
              path: "SnowTrial/Game.exe",
              lowerPath: "snowtrial/game.exe",
              ext: "exe",
              size: 1422000,
              depth: 1,
              fullPath: "C:\\Downloads\\SnowTrial-prepared\\SnowTrial\\Game.exe",
            },
            {
              name: "data.xp3",
              path: "SnowTrial/data.xp3",
              lowerPath: "snowtrial/data.xp3",
              ext: "xp3",
              size: 423000000,
              depth: 1,
              fullPath: "C:\\Downloads\\SnowTrial-prepared\\SnowTrial\\data.xp3",
            },
          ],
          meta: {
            platform: "win32",
            selectedCount: 1,
            skipped: 0,
            preparedFrom: "SnowTrial.zip",
            preparedOutputName: "SnowTrial-prepared",
            preparedKind: "extracted-archive",
          },
        };
      },
      launchEntry: async (payload) => {
        window.__launchPayloads.push(payload);
        return {
          ok: true,
          pid: 1234,
          entryName: "Game.exe",
          relativePath: "SnowTrial/Game.exe",
          workingDirectory: "C:\\Downloads\\SnowTrial-prepared\\SnowTrial",
        };
      },
      createShortcut: async () => ({ ok: true }),
      unmountImage: async () => ({ ok: true }),
      getLaunchHistory: async () => [],
      recognizeErrorImage: async () => ({ canceled: true }),
      onScanProgress: () => () => {},
      onPrepareProgress: () => () => {},
      onOcrProgress: () => () => {},
    };
  });
  await page.goto("/");

  await page.evaluate(async () => {
    const files = [fileFromSample(PACKAGE_SAMPLE_FILES[0])].map((file) => ({
      ...file,
      fullPath: `C:\\Downloads\\${file.path}`,
    }));
    await setFiles(files);
  });

  await expect(page.locator(".one-stop-wizard")).toContainText("一键准备并启动");
  await page.getByRole("button", { name: "一键准备并启动" }).click();
  await page.waitForFunction(() => window.__launchPayloads?.length === 1);

  const result = await page.evaluate(() => ({
    prepare: window.__preparePayloads[0],
    launch: window.__launchPayloads[0],
    pending: Boolean(pendingLaunchFollowup),
    entry: currentAnalysis.launchCandidates[0]?.file.path,
    droppedPaths: getDroppedDesktopPaths({
      files: [
        { path: "C:\\Downloads\\SnowTrial.zip" },
        { path: "C:\\Downloads\\SnowTrial.zip" },
        { name: "browser-only.zip" },
      ],
    }),
  }));

  expect(result.prepare.packageFullPath).toBe("C:\\Downloads\\SnowTrial.zip");
  expect(result.prepare.outputMode).toBe("auto");
  expect(result.launch.entryFullPath).toBe("C:\\Downloads\\SnowTrial-prepared\\SnowTrial\\Game.exe");
  expect(result.entry).toBe("SnowTrial/Game.exe");
  expect(result.pending).toBe(true);
  expect(result.droppedPaths).toEqual(["C:\\Downloads\\SnowTrial.zip"]);
});

test("desktop one-click flow opens install media when no game launcher exists", async ({ page }) => {
  await page.addInitScript(() => {
    window.__preparePayloads = [];
    window.__launchPayloads = [];
    window.galaidDesktop = {
      platform: "win32",
      selectFolder: async () => ({ canceled: true, files: [] }),
      selectFiles: async () => ({ canceled: true, files: [] }),
      scanPaths: async () => ({ canceled: true, files: [] }),
      preparePackage: async (payload) => {
        window.__preparePayloads.push(payload);
        return {
          ok: true,
          files: [
            {
              name: "Start.exe",
              path: "InstallDisc/Start.exe",
              lowerPath: "installdisc/start.exe",
              ext: "exe",
              size: 2412000,
              depth: 1,
              fullPath: "C:\\Downloads\\InstallDisc-prepared\\InstallDisc\\Start.exe",
            },
            {
              name: "autorun.inf",
              path: "InstallDisc/autorun.inf",
              lowerPath: "installdisc/autorun.inf",
              ext: "inf",
              size: 400,
              depth: 1,
              fullPath: "C:\\Downloads\\InstallDisc-prepared\\InstallDisc\\autorun.inf",
              textPreview: "[autorun]\nopen=Start.exe /install\n",
            },
            {
              name: "data1.cab",
              path: "InstallDisc/data1.cab",
              lowerPath: "installdisc/data1.cab",
              ext: "cab",
              size: 680000000,
              depth: 1,
              fullPath: "C:\\Downloads\\InstallDisc-prepared\\InstallDisc\\data1.cab",
            },
          ],
          meta: {
            platform: "win32",
            selectedCount: 1,
            skipped: 0,
            preparedFrom: "InstallDisc.iso",
            preparedOutputName: "InstallDisc-prepared",
            preparedKind: "extracted-image",
          },
        };
      },
      launchEntry: async (payload) => {
        window.__launchPayloads.push(payload);
        return {
          ok: true,
          pid: 3456,
          entryName: "Start.exe",
          relativePath: "InstallDisc/Start.exe",
          workingDirectory: "C:\\Downloads\\InstallDisc-prepared\\InstallDisc",
        };
      },
      createShortcut: async () => ({ ok: true }),
      unmountImage: async () => ({ ok: true }),
      getLaunchHistory: async () => [],
      recognizeErrorImage: async () => ({ canceled: true }),
      onScanProgress: () => () => {},
      onPrepareProgress: () => () => {},
      onOcrProgress: () => () => {},
    };
  });
  await page.goto("/");

  await page.evaluate(async () => {
    await setFiles([
      {
        name: "InstallDisc.iso",
        path: "InstallDisc.iso",
        lowerPath: "installdisc.iso",
        ext: "iso",
        size: 950000000,
        depth: 0,
        fullPath: "C:\\Downloads\\InstallDisc.iso",
      },
    ]);
  });

  await page.getByRole("button", { name: "一键准备并启动" }).click();
  await page.waitForFunction(() => window.__launchPayloads?.length === 1);

  const result = await page.evaluate(() => ({
    prepare: window.__preparePayloads[0],
    launch: window.__launchPayloads[0],
    launchCandidateCount: currentAnalysis.launchCandidates.length,
    installerEntry: currentAnalysis.installerCandidates[0]?.file.path,
    pending: Boolean(pendingLaunchFollowup),
  }));

  expect(result.prepare.packageFullPath).toBe("C:\\Downloads\\InstallDisc.iso");
  expect(result.launch.entryFullPath).toBe("C:\\Downloads\\InstallDisc-prepared\\InstallDisc\\Start.exe");
  expect(result.launchCandidateCount).toBe(0);
  expect(result.installerEntry).toBe("InstallDisc/Start.exe");
  expect(result.pending).toBe(false);
  await expect(page.locator(".one-stop-wizard")).toContainText("打开安装盘入口");
  await expect(page.getByRole("heading", { name: "安装盘入口", exact: true })).toBeVisible();
});

test("autorun.inf targets unusual setup names as install media", async ({ page }) => {
  await page.goto("/");

  const result = await page.evaluate(() => {
    const analysis = analyze([
      {
        name: "autorun.inf",
        path: "Disc/autorun.inf",
        lowerPath: "disc/autorun.inf",
        ext: "inf",
        size: 96,
        depth: 1,
        textPreview: "[autorun]\nshellexecute=Install/SetupJP.exe /silent\n",
      },
      {
        name: "SetupJP.exe",
        path: "Disc/Install/SetupJP.exe",
        lowerPath: "disc/install/setupjp.exe",
        ext: "exe",
        size: 3200000,
        depth: 2,
        fullPath: "C:\\Downloads\\Disc\\Install\\SetupJP.exe",
      },
      {
        name: "data1.cab",
        path: "Disc/data1.cab",
        lowerPath: "disc/data1.cab",
        ext: "cab",
        size: 760000000,
        depth: 1,
      },
    ]);
    return {
      launchCandidates: analysis.launchCandidates.map((candidate) => candidate.file.path),
      installerEntry: analysis.installerCandidates[0]?.file.path,
      installerReasons: analysis.installerCandidates[0]?.reasons || [],
    };
  });

  expect(result.launchCandidates).toEqual([]);
  expect(result.installerEntry).toBe("Disc/Install/SetupJP.exe");
  expect(result.installerReasons).toContain("autorun.inf target");
});

test("autorun.inf targets batch setup scripts as launchable install media", async ({ page }) => {
  await page.addInitScript(() => {
    window.galaidDesktop = {
      platform: "win32",
      selectFolder: async () => ({ canceled: true, files: [] }),
      selectFiles: async () => ({ canceled: true, files: [] }),
      scanPaths: async () => ({ canceled: true, files: [] }),
      launchEntry: async () => ({ ok: true }),
      getLaunchHistory: async () => [],
      onScanProgress: () => () => {},
      onPrepareProgress: () => () => {},
      onOcrProgress: () => () => {},
    };
  });
  await page.goto("/");

  const result = await page.evaluate(() => {
    const analysis = analyze([
      {
        name: "autorun.inf",
        path: "Disc/autorun.inf",
        lowerPath: "disc/autorun.inf",
        ext: "inf",
        size: 96,
        depth: 1,
        textPreview: "[autorun]\nopen=Install/Setup.cmd /silent\n",
      },
      {
        name: "Setup.cmd",
        path: "Disc/Install/Setup.cmd",
        lowerPath: "disc/install/setup.cmd",
        ext: "cmd",
        size: 820,
        depth: 2,
        fullPath: "C:\\Downloads\\Disc\\Install\\Setup.cmd",
      },
      {
        name: "data1.cab",
        path: "Disc/data1.cab",
        lowerPath: "disc/data1.cab",
        ext: "cab",
        size: 760000000,
        depth: 1,
      },
    ]);
    const installer = analysis.installerCandidates[0];
    return {
      launchCandidates: analysis.launchCandidates.map((candidate) => candidate.file.path),
      installerEntry: installer?.file.path,
      installerReasons: installer?.reasons || [],
      normalLaunch: canDesktopLaunchFile(installer?.file),
      installerLaunch: canDesktopLaunchInstallerCandidate(installer),
      html: renderInstallMediaEntries(analysis),
    };
  });

  expect(result.launchCandidates).toEqual([]);
  expect(result.installerEntry).toBe("Disc/Install/Setup.cmd");
  expect(result.installerReasons).toContain("autorun.inf target");
  expect(result.normalLaunch).toBe(false);
  expect(result.installerLaunch).toBe(true);
  expect(result.html).toContain("data-launch-action=\"installer-candidate\"");
  expect(result.html).not.toContain("disabled");
});

test("autorun.inf shell install commands become install media entries", async ({ page }) => {
  await page.goto("/");

  const result = await page.evaluate(() => {
    const analysis = analyze([
      {
        name: "autorun.inf",
        path: "Disc/autorun.inf",
        lowerPath: "disc/autorun.inf",
        ext: "inf",
        size: 160,
        depth: 1,
        textPreview: "[autorun]\nshell\\install=Install game\nshell\\install\\command=Bin/SetupVN.exe /install\n",
      },
      {
        name: "SetupVN.exe",
        path: "Disc/Bin/SetupVN.exe",
        lowerPath: "disc/bin/setupvn.exe",
        ext: "exe",
        size: 3300000,
        depth: 2,
        fullPath: "C:\\Downloads\\Disc\\Bin\\SetupVN.exe",
      },
      {
        name: "data1.cab",
        path: "Disc/data1.cab",
        lowerPath: "disc/data1.cab",
        ext: "cab",
        size: 760000000,
        depth: 1,
      },
    ]);
    return {
      launchCandidates: analysis.launchCandidates.map((candidate) => candidate.file.path),
      installerEntry: analysis.installerCandidates[0]?.file.path,
      installerReasons: analysis.installerCandidates[0]?.reasons || [],
    };
  });

  expect(result.launchCandidates).toEqual([]);
  expect(result.installerEntry).toBe("Disc/Bin/SetupVN.exe");
  expect(result.installerReasons).toContain("autorun.inf target");
});

test("MSI installers are install media entries and desktop launchable", async ({ page }) => {
  await page.addInitScript(() => {
    window.galaidDesktop = {
      platform: "win32",
      selectFolder: async () => ({ canceled: true, files: [] }),
      selectFiles: async () => ({ canceled: true, files: [] }),
      scanPaths: async () => ({ canceled: true, files: [] }),
      launchEntry: async () => ({ ok: true }),
      getLaunchHistory: async () => [],
      onScanProgress: () => () => {},
      onPrepareProgress: () => () => {},
      onOcrProgress: () => () => {},
    };
  });
  await page.goto("/");

  const result = await page.evaluate(() => {
    const analysis = analyze([
      {
        name: "Installer.msi",
        path: "Disc/Installer.msi",
        lowerPath: "disc/installer.msi",
        ext: "msi",
        size: 88000000,
        depth: 1,
        fullPath: "C:\\Downloads\\Disc\\Installer.msi",
      },
      {
        name: "data1.cab",
        path: "Disc/data1.cab",
        lowerPath: "disc/data1.cab",
        ext: "cab",
        size: 760000000,
        depth: 1,
      },
    ]);
    return {
      launchCandidates: analysis.launchCandidates.map((candidate) => candidate.file.path),
      installerEntry: analysis.installerCandidates[0]?.file.path,
      installerReasons: analysis.installerCandidates[0]?.reasons || [],
      canLaunch: canDesktopLaunchFile(analysis.installerCandidates[0]?.file),
      html: renderInstallMediaEntries(analysis),
    };
  });

  expect(result.launchCandidates).toEqual([]);
  expect(result.installerEntry).toBe("Disc/Installer.msi");
  expect(result.installerReasons).toContain("Windows Installer package");
  expect(result.canLaunch).toBe(true);
  expect(result.html).toContain("data-launch-action=\"installer-candidate\"");
});

test("desktop launch buttons support scanned Windows shortcuts", async ({ page }) => {
  await page.addInitScript(() => {
    window.__launchPayloads = [];
    window.galaidDesktop = {
      platform: "win32",
      selectFolder: async () => ({ canceled: true, files: [] }),
      selectFiles: async () => ({ canceled: true, files: [] }),
      scanPaths: async () => ({ canceled: true, files: [] }),
      launchEntry: async (payload) => {
        window.__launchPayloads.push(payload);
        return {
          ok: true,
          pid: 4567,
          entryName: "Play.lnk",
          relativePath: "ShortcutVN/Play.lnk",
          workingDirectory: "C:\\Games\\ShortcutVN",
        };
      },
      getLaunchHistory: async () => [],
      onScanProgress: () => () => {},
      onPrepareProgress: () => () => {},
      onOcrProgress: () => () => {},
    };
  });
  await page.goto("/");

  await page.evaluate(async () => {
    await setFiles([
      {
        name: "Play.lnk",
        path: "ShortcutVN/Play.lnk",
        lowerPath: "shortcutvn/play.lnk",
        ext: "lnk",
        size: 1400,
        depth: 1,
        fullPath: "C:\\Games\\ShortcutVN\\Play.lnk",
      },
      {
        name: "data.xp3",
        path: "ShortcutVN/data.xp3",
        lowerPath: "shortcutvn/data.xp3",
        ext: "xp3",
        size: 420000000,
        depth: 1,
        fullPath: "C:\\Games\\ShortcutVN\\data.xp3",
      },
    ]);
  });

  await expect(page.locator(".candidate").filter({ hasText: "Play.lnk" })).toContainText("启动");
  await page.locator(".candidate").filter({ hasText: "Play.lnk" }).getByRole("button", { name: "启动" }).click();
  await page.waitForFunction(() => window.__launchPayloads?.length === 1);

  const result = await page.evaluate(() => ({
    launch: window.__launchPayloads[0],
    entry: currentAnalysis.launchCandidates[0]?.file.path,
    canLaunch: canDesktopLaunchFile(currentAnalysis.launchCandidates[0]?.file),
  }));

  expect(result.entry).toBe("ShortcutVN/Play.lnk");
  expect(result.canLaunch).toBe(true);
  expect(result.launch.entryFullPath).toBe("C:\\Games\\ShortcutVN\\Play.lnk");
});

test("desktop launch buttons support trusted Windows launch scripts", async ({ page }) => {
  await page.addInitScript(() => {
    window.__launchPayloads = [];
    window.galaidDesktop = {
      platform: "win32",
      selectFolder: async () => ({ canceled: true, files: [] }),
      selectFiles: async () => ({ canceled: true, files: [] }),
      scanPaths: async () => ({ canceled: true, files: [] }),
      launchEntry: async (payload) => {
        window.__launchPayloads.push(payload);
        return {
          ok: true,
          pid: 5678,
          entryName: "Start.bat",
          relativePath: "ScriptVN/Start.bat",
          workingDirectory: "C:\\Games\\ScriptVN",
        };
      },
      getLaunchHistory: async () => [],
      onScanProgress: () => () => {},
      onPrepareProgress: () => () => {},
      onOcrProgress: () => () => {},
    };
  });
  await page.goto("/");

  await page.evaluate(async () => {
    await setFiles([
      {
        name: "Start.bat",
        path: "ScriptVN/Start.bat",
        lowerPath: "scriptvn/start.bat",
        ext: "bat",
        size: 220,
        depth: 1,
        fullPath: "C:\\Games\\ScriptVN\\Start.bat",
      },
      {
        name: "setup.bat",
        path: "ScriptVN/setup.bat",
        lowerPath: "scriptvn/setup.bat",
        ext: "bat",
        size: 220,
        depth: 1,
        fullPath: "C:\\Games\\ScriptVN\\setup.bat",
      },
      {
        name: "data.xp3",
        path: "ScriptVN/data.xp3",
        lowerPath: "scriptvn/data.xp3",
        ext: "xp3",
        size: 420000000,
        depth: 1,
        fullPath: "C:\\Games\\ScriptVN\\data.xp3",
      },
    ]);
  });

  await expect(page.locator(".candidate").filter({ hasText: "Start.bat" })).toContainText("启动");
  await expect(page.locator(".candidate").filter({ hasText: "setup.bat" })).toHaveCount(0);
  await page.locator(".candidate").filter({ hasText: "Start.bat" }).getByRole("button", { name: "启动" }).click();
  await page.waitForFunction(() => window.__launchPayloads?.length === 1);

  const result = await page.evaluate(() => ({
    launch: window.__launchPayloads[0],
    entry: currentAnalysis.launchCandidates[0]?.file.path,
    canLaunch: canDesktopLaunchFile(currentAnalysis.launchCandidates[0]?.file),
    setupCanLaunch: canDesktopLaunchFile({
      name: "setup.bat",
      path: "ScriptVN/setup.bat",
      lowerPath: "scriptvn/setup.bat",
      ext: "bat",
      fullPath: "C:\\Games\\ScriptVN\\setup.bat",
    }),
  }));

  expect(result.entry).toBe("ScriptVN/Start.bat");
  expect(result.canLaunch).toBe(true);
  expect(result.setupCanLaunch).toBe(false);
  expect(result.launch.entryFullPath).toBe("C:\\Games\\ScriptVN\\Start.bat");
});

test("legacy executable headers route DOS and Win16 away from direct launch", async ({ page }) => {
  await page.addInitScript(() => {
    window.galaidDesktop = {
      platform: "win32",
      selectFolder: async () => ({ canceled: true, files: [] }),
      selectFiles: async () => ({ canceled: true, files: [] }),
      scanPaths: async () => ({ canceled: true, files: [] }),
      launchEntry: async () => ({ ok: true }),
      getLaunchHistory: async () => [],
      onScanProgress: () => () => {},
      onPrepareProgress: () => () => {},
      onOcrProgress: () => () => {},
    };
  });
  await page.goto("/");

  const result = await page.evaluate(() => {
    const analysis = analyze([
      {
        name: "Game.exe",
        path: "LegacyVN/Game.exe",
        lowerPath: "legacyvn/game.exe",
        ext: "exe",
        size: 320000,
        depth: 1,
        fullPath: "C:\\Games\\LegacyVN\\Game.exe",
        executableInfo: {
          schema: "galaid.executableInfo.v1",
          format: "ne",
          runtime: "win16",
          bitness: "16-bit",
          label: "Windows NE / Win16 executable",
          route: "win16-vm",
          confidence: "high",
        },
      },
      {
        name: "DOSGAME.COM",
        path: "LegacyVN/DOSGAME.COM",
        lowerPath: "legacyvn/dosgame.com",
        ext: "com",
        size: 4096,
        depth: 1,
        fullPath: "C:\\Games\\LegacyVN\\DOSGAME.COM",
        executableInfo: {
          schema: "galaid.executableInfo.v1",
          format: "dos-com",
          runtime: "dos",
          bitness: "16-bit",
          label: "DOS COM executable",
          route: "dosbox",
          confidence: "medium",
        },
      },
      {
        name: "data.arc",
        path: "LegacyVN/data.arc",
        lowerPath: "legacyvn/data.arc",
        ext: "arc",
        size: 120000000,
        depth: 1,
      },
    ]);
    const legacyCheck = analysis.environment.checks.find((check) => check.id === "legacy-runtime");
    const legacyStep = analysis.roadmap.steps.find((step) => step.id === "env-legacy-runtime");
    const topCandidate = analysis.launchCandidates[0];
    return {
      topEntry: topCandidate?.file.path,
      canLaunchTop: canDesktopLaunchFile(topCandidate?.file),
      legacyStatus: legacyCheck?.status,
      legacyAction: legacyCheck?.action,
      legacyEvidence: legacyCheck?.evidence || [],
      roadmapState: legacyStep?.state,
      manifestInfo: buildFileManifest(analysis).files[0]?.executableInfo?.runtime,
    };
  });

  expect(result.topEntry).toBe("LegacyVN/Game.exe");
  expect(result.canLaunchTop).toBe(false);
  expect(result.legacyStatus).toBe("blocker");
  expect(result.legacyAction).toContain("DOSBox");
  expect(result.legacyAction).toContain("虚拟机");
  expect(result.legacyEvidence.join("\n")).toContain("Win16");
  expect(result.roadmapState).toBe("blocked");
  expect(result.manifestInfo).toBe("win16");
});

test("old Win32 PE headers stay launchable but add compatibility guidance", async ({ page }) => {
  await page.addInitScript(() => {
    window.galaidDesktop = {
      platform: "win32",
      selectFolder: async () => ({ canceled: true, files: [] }),
      selectFiles: async () => ({ canceled: true, files: [] }),
      scanPaths: async () => ({ canceled: true, files: [] }),
      launchEntry: async () => ({ ok: true }),
      getLaunchHistory: async () => [],
      onScanProgress: () => () => {},
      onPrepareProgress: () => () => {},
      onOcrProgress: () => () => {},
    };
  });
  await page.goto("/");

  const result = await page.evaluate(() => {
    const analysis = analyze([
      {
        name: "Game.exe",
        path: "XpVN/Game.exe",
        lowerPath: "xpvn/game.exe",
        ext: "exe",
        size: 640000,
        depth: 1,
        fullPath: "C:\\Games\\XpVN\\Game.exe",
        executableInfo: {
          schema: "galaid.executableInfo.v1",
          format: "pe",
          runtime: "win32",
          bitness: "32-bit",
          architecture: "x86",
          subsystem: "windows-gui",
          subsystemVersion: "5.1",
          targetEra: "win2000-xp-era",
          runtimeImports: ["ddraw.dll", "dsound.dll", "winmm.dll", "msvcr71.dll", "msvbvm60.dll", "mscoree.dll", "qtmlclient.dll"],
          importHints: ["legacy-directdraw", "legacy-directsound", "legacy-winmm", "legacy-vc", "legacy-vb6", "legacy-dotnet", "legacy-quicktime"],
          label: "32-bit Windows PE executable",
          route: "native-windows",
          confidence: "high",
        },
      },
      {
        name: "data.arc",
        path: "XpVN/data.arc",
        lowerPath: "xpvn/data.arc",
        ext: "arc",
        size: 180000000,
        depth: 1,
      },
      {
        name: "DXSETUP.exe",
        path: "XpVN/Support/DirectX/DXSETUP.exe",
        lowerPath: "xpvn/support/directx/dxsetup.exe",
        ext: "exe",
        size: 900000,
        depth: 3,
        fullPath: "C:\\Games\\XpVN\\Support\\DirectX\\DXSETUP.exe",
      },
      {
        name: "vcredist_x86.exe",
        path: "XpVN/Support/VC/vcredist_x86.exe",
        lowerPath: "xpvn/support/vc/vcredist_x86.exe",
        ext: "exe",
        size: 6200000,
        depth: 3,
        fullPath: "C:\\Games\\XpVN\\Support\\VC\\vcredist_x86.exe",
      },
      {
        name: "dotnetfx.exe",
        path: "XpVN/Support/DotNet/dotnetfx.exe",
        lowerPath: "xpvn/support/dotnet/dotnetfx.exe",
        ext: "exe",
        size: 32000000,
        depth: 3,
        fullPath: "C:\\Games\\XpVN\\Support\\DotNet\\dotnetfx.exe",
      },
      {
        name: "vbrun60sp6.exe",
        path: "XpVN/Support/VB6/vbrun60sp6.exe",
        lowerPath: "xpvn/support/vb6/vbrun60sp6.exe",
        ext: "exe",
        size: 1100000,
        depth: 3,
        fullPath: "C:\\Games\\XpVN\\Support\\VB6\\vbrun60sp6.exe",
      },
      {
        name: "QuickTimeInstaller.exe",
        path: "XpVN/Support/QuickTime/QuickTimeInstaller.exe",
        lowerPath: "xpvn/support/quicktime/quicktimeinstaller.exe",
        ext: "exe",
        size: 18000000,
        depth: 3,
        fullPath: "C:\\Games\\XpVN\\Support\\QuickTime\\QuickTimeInstaller.exe",
      },
    ]);
    const compatibilityCheck = analysis.environment.checks.find((check) => check.id === "legacy-win32");
    const compatibilityStep = analysis.roadmap.steps.find((step) => step.id === "env-legacy-win32");
    const directXCheck = analysis.environment.checks.find((check) => check.id === "directx");
    const vcCheck = analysis.environment.checks.find((check) => check.id === "vcredist");
    const legacyRuntimeCheck = analysis.environment.checks.find((check) => check.id === "legacy-runtime-imports");
    const topCandidate = analysis.launchCandidates[0];
    const profile = analysis.profiles[0];
    const directXRepair = analysis.runtimeRepairs.find((repair) => repair.type === "DirectX");
    const vcRepair = analysis.runtimeRepairs.find((repair) => repair.type === "VC++");
    const dotNetRepair = analysis.runtimeRepairs.find((repair) => repair.type === ".NET Framework");
    const vb6Repair = analysis.runtimeRepairs.find((repair) => repair.type === "VB6 Runtime");
    const quickTimeRepair = analysis.runtimeRepairs.find((repair) => repair.type === "QuickTime");
    const contextualAnalysis = applyDesktopEnvironmentToAnalysis(analysis, {
      ok: true,
      platform: "win32",
      checkedAt: "2026-05-23T00:00:00.000Z",
      summary: { status: "warning", label: "本机环境检测", detail: "contextual", counts: { good: 0, warning: 3, info: 1 } },
      checks: [
        {
          id: "directx-native",
          title: "DirectX 旧组件",
          status: "warning",
          statusLabel: "建议处理",
          detail: "没有检测到常见 DirectX 9 时代 DLL。",
          action: "补 DirectX End-User Runtime。",
          evidence: [],
        },
        {
          id: "dotnet-native",
          title: ".NET Framework",
          status: "warning",
          statusLabel: "建议处理",
          detail: "没有在常见注册表位置检测到 .NET Framework。",
          action: "补 .NET Framework。",
          evidence: [],
        },
        {
          id: "vb6-native",
          title: "VB6 运行库",
          status: "warning",
          statusLabel: "建议处理",
          detail: "没有检测到 msvbvm60.dll。",
          action: "补 VB6 运行库。",
          evidence: [],
        },
        {
          id: "quicktime-native",
          title: "QuickTime/旧视频组件",
          status: "info",
          statusLabel: "观察",
          detail: "没有检测到 QuickTime。",
          action: "补 QuickTime 或跳过片头。",
          evidence: [],
        },
      ],
    });
    const nativeSteps = contextualAnalysis.roadmap.steps.filter((step) => step.source === "desktop-environment");
    return {
      topEntry: topCandidate?.file.path,
      canLaunchTop: canDesktopLaunchFile(topCandidate?.file),
      compatibilityStatus: compatibilityCheck?.status,
      compatibilityAction: compatibilityCheck?.action,
      compatibilityEvidence: compatibilityCheck?.evidence || [],
      directXStatus: directXCheck?.status,
      directXEvidence: directXCheck?.evidence || [],
      directXRepairRecommended: directXRepair?.recommended,
      directXRepairReason: directXRepair?.reason,
      vcStatus: vcCheck?.status,
      vcRepairRecommended: vcRepair?.recommended,
      legacyRuntimeStatus: legacyRuntimeCheck?.status,
      legacyRuntimeEvidence: legacyRuntimeCheck?.evidence || [],
      dotNetRepairRecommended: dotNetRepair?.recommended,
      vb6RepairRecommended: vb6Repair?.recommended,
      quickTimeRepairRecommended: quickTimeRepair?.recommended,
      roadmapState: compatibilityStep?.state,
      manifestInfo: buildFileManifest(analysis).files[0]?.executableInfo?.targetEra,
      manifestImports: buildFileManifest(analysis).files[0]?.executableInfo?.runtimeImports,
      nativeStepIds: nativeSteps.map((step) => step.id),
      nativeStepText: nativeSteps.map((step) => `${step.title}: ${step.detail}`).join("\n"),
      profileInfo: profile?.config?.executableInfo?.subsystemVersion,
    };
  });

  expect(result.topEntry).toBe("XpVN/Game.exe");
  expect(result.canLaunchTop).toBe(true);
  expect(result.compatibilityStatus).toBe("warning");
  expect(result.compatibilityAction).toContain("XP SP3");
  expect(result.compatibilityAction).toContain("DirectX End-User Runtime");
  expect(result.compatibilityEvidence.join("\n")).toContain("subsystem 5.1");
  expect(result.directXStatus).toBe("warning");
  expect(result.directXEvidence.join("\n")).toContain("ddraw.dll");
  expect(result.directXRepairRecommended).toBe(true);
  expect(result.directXRepairReason).toContain("旧图形/声音组件");
  expect(result.vcStatus).toBe("warning");
  expect(result.vcRepairRecommended).toBe(true);
  expect(result.legacyRuntimeStatus).toBe("warning");
  expect(result.legacyRuntimeEvidence.join("\n")).toContain("msvbvm60.dll");
  expect(result.dotNetRepairRecommended).toBe(true);
  expect(result.vb6RepairRecommended).toBe(true);
  expect(result.quickTimeRepairRecommended).toBe(true);
  expect(result.roadmapState).toBe("todo");
  expect(result.manifestInfo).toBe("win2000-xp-era");
  expect(result.manifestImports).toContain("ddraw.dll");
  expect(result.manifestImports).toContain("msvbvm60.dll");
  expect(result.nativeStepIds).toEqual(expect.arrayContaining(["native-directx-native", "native-dotnet-native", "native-vb6-native", "native-quicktime-native"]));
  expect(result.nativeStepText).toContain("没有检测到 QuickTime");
  expect(result.profileInfo).toBe("5.1");
});

test("DirectShow and MCI imports promote old video component repairs", async ({ page }) => {
  await page.goto("/");

  const result = await page.evaluate(() => {
    const analysis = analyze([
      {
        name: "MovieVN.exe",
        path: "MovieVN/MovieVN.exe",
        lowerPath: "movievn/movievn.exe",
        ext: "exe",
        size: 580000,
        depth: 1,
        fullPath: "C:\\Games\\MovieVN\\MovieVN.exe",
        executableInfo: {
          schema: "galaid.executableInfo.v1",
          format: "pe",
          runtime: "win32",
          bitness: "32-bit",
          architecture: "x86",
          runtimeImports: ["quartz.dll", "mciqtz32.dll", "winmm.dll"],
          importHints: ["legacy-directshow", "legacy-winmm"],
          label: "32-bit Windows PE executable",
          route: "native-windows",
          confidence: "high",
        },
      },
      {
        name: "QuickTimeInstaller.exe",
        path: "MovieVN/Support/QuickTimeInstaller.exe",
        lowerPath: "movievn/support/quicktimeinstaller.exe",
        ext: "exe",
        size: 18000000,
        depth: 2,
        fullPath: "C:\\Games\\MovieVN\\Support\\QuickTimeInstaller.exe",
      },
    ]);
    const quickTimeRepair = analysis.runtimeRepairs.find((repair) => repair.type === "QuickTime");
    const legacyRuntimeCheck = analysis.environment.checks.find((check) => check.id === "legacy-runtime-imports");
    const contextualAnalysis = applyDesktopEnvironmentToAnalysis(analysis, {
      ok: true,
      platform: "win32",
      checkedAt: "2026-05-31T00:00:00.000Z",
      summary: { status: "good", label: "本机环境检测", detail: "contextual", counts: { good: 0, warning: 0, info: 1 } },
      checks: [
        {
          id: "quicktime-native",
          title: "QuickTime/旧视频组件",
          status: "info",
          statusLabel: "观察",
          detail: "没有检测到 QuickTime 或常见旧视频组件。",
          action: "遇到 MCI/DirectShow 或片头视频黑屏时，再补对应视频组件。",
          evidence: [],
        },
      ],
    });
    const nativeStep = contextualAnalysis.roadmap.steps.find((step) => step.id === "native-quicktime-native");

    return {
      quickTimeRepairRecommended: quickTimeRepair?.recommended,
      quickTimeRepairReason: quickTimeRepair?.reason,
      legacyRuntimeEvidence: legacyRuntimeCheck?.evidence || [],
      nativeStepState: nativeStep?.state,
      nativeStepDetail: nativeStep?.detail,
      manifestImports: buildFileManifest(analysis).files[0]?.executableInfo?.runtimeImports,
    };
  });

  expect(result.quickTimeRepairRecommended).toBe(true);
  expect(result.quickTimeRepairReason).toContain("旧视频播放组件");
  expect(result.legacyRuntimeEvidence.join("\n")).toContain("quartz.dll");
  expect(result.nativeStepState).toBe("todo");
  expect(result.nativeStepDetail).toContain("常见旧视频组件");
  expect(result.manifestImports).toEqual(expect.arrayContaining(["quartz.dll", "mciqtz32.dll"]));
});

test("desktop one-click flow retries password-protected packages", async ({ page }) => {
  await page.addInitScript(() => {
    window.__preparePayloads = [];
    window.__launchPayloads = [];
    window.galaidDesktop = {
      platform: "win32",
      selectFolder: async () => ({ canceled: true, files: [] }),
      selectFiles: async () => ({ canceled: true, files: [] }),
      scanPaths: async () => ({ canceled: true, files: [] }),
      preparePackage: async (payload) => {
        window.__preparePayloads.push(payload);
        if (payload.password !== "correct-password") {
          return { ok: false, errorCode: "password-failed", message: "This package needs the correct extraction password." };
        }
        return {
          ok: true,
          files: [
            {
              name: "Game.exe",
              path: "MoonlightCafe/Game.exe",
              lowerPath: "moonlightcafe/game.exe",
              ext: "exe",
              size: 1680000,
              depth: 1,
              fullPath: "C:\\Downloads\\MoonlightCafe-prepared\\MoonlightCafe\\Game.exe",
            },
            {
              name: "data00.arc",
              path: "MoonlightCafe/data00.arc",
              lowerPath: "moonlightcafe/data00.arc",
              ext: "arc",
              size: 1380000000,
              depth: 1,
              fullPath: "C:\\Downloads\\MoonlightCafe-prepared\\MoonlightCafe\\data00.arc",
            },
          ],
          meta: {
            platform: "win32",
            selectedCount: 1,
            skipped: 0,
            preparedFrom: "MoonlightCafe.part1.rar",
            preparedOutputName: "MoonlightCafe-prepared",
            preparedKind: "extracted-archive",
          },
        };
      },
      launchEntry: async (payload) => {
        window.__launchPayloads.push(payload);
        return {
          ok: true,
          pid: 2345,
          entryName: "Game.exe",
          relativePath: "MoonlightCafe/Game.exe",
          workingDirectory: "C:\\Downloads\\MoonlightCafe-prepared\\MoonlightCafe",
        };
      },
      createShortcut: async () => ({ ok: true }),
      unmountImage: async () => ({ ok: true }),
      getLaunchHistory: async () => [],
      recognizeErrorImage: async () => ({ canceled: true }),
      onScanProgress: () => () => {},
      onPrepareProgress: () => () => {},
      onOcrProgress: () => () => {},
    };
  });
  const dialogAnswers = ["wrong-password", "correct-password"];
  page.on("dialog", async (dialog) => {
    await dialog.accept(dialogAnswers.shift() || "correct-password");
  });
  await page.goto("/");

  await page.evaluate(async () => {
    const raw = JSON.parse(JSON.stringify(PACKAGE_SAMPLE_FILES[1]));
    raw[2].archivePreview.encryptedEntries = 12;
    const files = [fileFromSample(raw)].map((file) => ({
      ...file,
      fullPath: `C:\\Downloads\\${file.path}`,
    }));
    await setFiles(files);
  });

  await page.locator('[data-tab="packages"]').click();
  await expect(page.locator("#packagesPanel")).toContainText("12 加密条目");
  await expect(page.locator(".package-roadmap")).toContainText("12 个加密条目");

  const preflightSupport = await page.evaluate(() => {
    const bundle = buildSupportBundle(currentAnalysis, "", "zh-CN");
    const report = JSON.parse(bundle.entries.find((entry) => entry.path === "package-previews.json").content);
    const manifest = JSON.parse(bundle.entries.find((entry) => entry.path === "manifest.json").content);
    const fileManifest = JSON.parse(bundle.entries.find((entry) => entry.path === "file-manifest.json").content);
    return {
      encryptedEntryCount: report.encryptedEntryCount,
      encryptedEntries: report.entries[0]?.encryptedEntries,
      passwordProtected: report.entries[0]?.passwordProtected,
      manifestEncryptedEntries: manifest.summary.encryptedEntries,
      manifestPasswordProtectedPackages: manifest.summary.passwordProtectedPackages,
      fileManifestEncryptedEntryCount: fileManifest.encryptedEntryCount,
      fileManifestPasswordProtectedPackages: fileManifest.passwordProtectedPackages,
      markdown: bundle.entries.find((entry) => entry.path === "package-previews.md").content,
      readme: bundle.entries.find((entry) => entry.path === "README.txt").content,
      summary: buildSupportSummaryText(currentAnalysis, manifest, bundle.filename, "zh-CN"),
    };
  });
  expect(preflightSupport.encryptedEntryCount).toBe(12);
  expect(preflightSupport.encryptedEntries).toBe(12);
  expect(preflightSupport.passwordProtected).toBe(true);
  expect(preflightSupport.manifestEncryptedEntries).toBe(12);
  expect(preflightSupport.manifestPasswordProtectedPackages).toBe(1);
  expect(preflightSupport.fileManifestEncryptedEntryCount).toBe(12);
  expect(preflightSupport.fileManifestPasswordProtectedPackages).toBe(1);
  expect(preflightSupport.markdown).toContain("加密条目: 12");
  expect(preflightSupport.readme).toContain("加密条目: 12 / 疑似密码包: 1");
  expect(preflightSupport.summary).toContain("加密条目: 12 / 疑似密码包: 1");

  await page.locator('[data-tab="report"]').click();
  await expect(page.locator("#reportPanel")).toContainText("压缩包可能需要解压密码");
  await expect(page.locator("#reportPanel")).toContainText("12 加密条目");

  await page.locator('[data-tab="launch"]').click();
  await page.getByRole("button", { name: "一键准备并启动" }).click();
  await page.waitForFunction(() => window.__launchPayloads?.length === 1);

  const result = await page.evaluate(() => ({
    passwords: window.__preparePayloads.map((payload) => payload.password),
    outputModes: window.__preparePayloads.map((payload) => payload.outputMode),
    launch: window.__launchPayloads[0],
    pending: Boolean(pendingLaunchFollowup),
  }));

  expect(result.passwords).toEqual(["wrong-password", "correct-password"]);
  expect(result.outputModes).toEqual(["auto", "auto"]);
  expect(result.launch.entryFullPath).toBe("C:\\Downloads\\MoonlightCafe-prepared\\MoonlightCafe\\Game.exe");
  expect(result.pending).toBe(true);
});

test("desktop runtime repair tools launch separately from game candidates", async ({ page }) => {
  await page.addInitScript(() => {
    window.__launchPayloads = [];
    window.galaidDesktop = {
      platform: "win32",
      selectFolder: async () => ({ canceled: true, files: [] }),
      selectFiles: async () => ({ canceled: true, files: [] }),
      scanPaths: async () => ({ canceled: true, files: [] }),
      launchEntry: async (payload) => {
        window.__launchPayloads.push(payload);
        return {
          ok: true,
          entryName: payload.entryFullPath.split("\\").pop(),
          relativePath: payload.entryFullPath.includes("vcredist") ? "SakuraTrial/vcredist_x86.exe" : "SakuraTrial/game.exe",
        };
      },
      getLaunchHistory: async () => [],
      onScanProgress: () => () => {},
      onPrepareProgress: () => () => {},
      onOcrProgress: () => () => {},
    };
  });

  await page.goto("/");
  await page.evaluate(async () => {
    await setFiles(
      SAMPLE_FILES.map(fileFromSample).map((file) => ({
        ...file,
        fullPath: `C:\\Games\\${file.path.replaceAll("/", "\\")}`,
      })),
    );
  });
  await page.locator("#errorInput").fill("VCRUNTIME140.dll was not found");

  await expect(page.getByRole("heading", { name: "运行库修复工具" })).toBeVisible();
  await expect(page.locator(".repair-tool-card")).toContainText("VC++ 运行库修复");
  await expect(page.locator(".repair-tool-card")).toContainText("当前报错相关");
  await expect(page.locator(".candidate").filter({ hasText: "game.exe" })).toContainText("启动");
  await expect(page.locator(".candidate").filter({ hasText: "vcredist_x86.exe" })).toHaveCount(1);
  await expect(page.locator(".one-stop-wizard")).toContainText("打开推荐修复工具");
  await expect(page.locator(".one-stop-wizard")).toContainText("修复后再回到推荐入口重试");

  await page.locator(".one-stop-wizard").getByRole("button", { name: "打开推荐修复工具" }).click();

  const launchPayloads = await page.evaluate(() => window.__launchPayloads);
  expect(launchPayloads).toHaveLength(1);
  expect(launchPayloads[0].entryFullPath).toBe("C:\\Games\\SakuraTrial\\vcredist_x86.exe");
  await expect(page.locator(".launch-attempt-card")).toHaveCount(0);
});

test("prepared desktop handoff highlights the next launch entry", async ({ page }) => {
  await page.goto("/");

  const handoffHtml = await page.evaluate(() => {
    const files = SAMPLE_FILES.map(fileFromSample).map((file) => ({
      ...file,
      fullPath: `C:\\VN\\${file.path.replaceAll("/", "\\")}`,
    }));
    const analysis = analyze(files);
    analysis.desktopMeta = {
      platform: "win32",
      selectedCount: 1,
      skipped: 0,
      preparedFrom: "SakuraTrial.zip",
      preparedOutputName: "SakuraTrial-prepared",
      preparedKind: "mounted-image",
      mountedImageDrive: "R:\\",
    };
    return renderLaunch(analysis);
  });

  expect(handoffHtml).toContain("准备完成");
  expect(handoffHtml).toContain("SakuraTrial.zip");
  expect(handoffHtml).toContain("SakuraTrial-prepared");
  expect(handoffHtml).toContain("SakuraTrial/game.exe");
  expect(handoffHtml).toContain("当前来自已挂载镜像");
  expect(handoffHtml).toContain('data-candidate-index="0"');
});

test("launch attempt follow-up can mark a failure symptom", async ({ page }) => {
  await page.goto("/");

  const followupHtml = await page.evaluate(() => {
    pendingLaunchFollowup = {
      entryName: "game.exe",
      relativePath: "SakuraTrial/game.exe",
      launchedAt: new Date().toISOString(),
    };
    return renderLaunch(analyze(SAMPLE_FILES.map(fileFromSample)));
  });
  expect(followupHtml).toContain("刚才启动了吗？");
  expect(followupHtml).toContain("点了没反应");

  const symptomState = await page.evaluate(() => {
    markLaunchAttemptSymptom("nothing");
    return {
      pending: Boolean(pendingLaunchFollowup),
      symptoms: launchFailureState.symptoms,
    };
  });
  expect(symptomState.pending).toBe(false);
  expect(symptomState.symptoms).toContain("nothing");
});

test("launch failure follow-up updates roadmap and support bundle", async ({ page }) => {
  const privateWinPath = makeWindowsUserPath("Downloads", "SakuraTrial", "game.exe");
  const privateMacPath = makeMacUserPath("Games", "SakuraTrial", "game.exe");

  await page.goto("/");

  await page.getByRole("button", { name: "游戏样例" }).click();
  await expect(page.getByRole("heading", { name: "启动失败了吗？" }).first()).toBeVisible();
  await expect(page.locator(".failure-triage")).toContainText("快速问诊");

  await page.locator('[data-failure-triage-question="visible-result"][data-failure-triage-option="dialog-text"]').check();
  await page.locator('[data-failure-triage-question="source-state"][data-failure-triage-option="from-package"]').check();
  await page.locator('[data-failure-triage-question="error-capture"][data-failure-triage-option="can-copy"]').check();
  await page.locator('[data-failure-symptom="missing-dll"]').check();
  await page.locator("[data-failure-note]").fill(`${privateWinPath} and ${privateMacPath}: VCRUNTIME140.dll was not found`);
  await page.getByRole("button", { name: "更新路线" }).click();

  await expect(page.locator("#launchPanel")).toContainText("已记录 5 条现象");
  await page.locator('[data-tab="roadmap"]').click();
  await expect(page.locator(".roadmap-list")).toContainText("先补充可复制报错");
  await expect(page.locator(".roadmap-list")).toContainText("先完整准备游戏目录");
  await expect(page.locator(".roadmap-list")).toContainText("缺 DLL/运行库");
  await expect(page.locator(".roadmap-list")).toContainText("VC++ 运行库");

  await page.locator('[data-tab="support"]').click();
  await expect(page.locator(".support-file-list")).toContainText("launch-failure.json");
  await expect(page.locator(".support-preview")).toContainText("启动失败跟进");
  await expect(page.locator(".support-preview")).toContainText("有弹窗文字");
  await expect(page.locator(".support-preview")).toContainText("VCRUNTIME140.dll was not found");
  await expect(page.locator(".support-preview")).toContainText("[absolute-path]");
  await expect(page.locator(".support-preview")).not.toContainText(privateWinPath);
  await expect(page.locator(".support-preview")).not.toContainText(privateMacPath);

  const chatHelp = await page.evaluate(() => buildChatHelpText(currentAnalysis, "zh-CN"));
  expect(chatHelp).toContain("[absolute-path]");
  expect(chatHelp).not.toContain(privateWinPath);
  expect(chatHelp).not.toContain(privateMacPath);

  await page.locator('[data-tab="report"]').click();
  await expect(page.locator("#reportPanel")).toContainText("## 启动失败跟进");
  await expect(page.locator("#reportPanel")).toContainText("问诊答案");
  await expect(page.locator("#reportPanel")).toContainText("缺 DLL/运行库");
  await expect(page.locator("#reportPanel")).toContainText("[absolute-path]");
  await expect(page.locator("#reportPanel")).not.toContainText(privateWinPath);
  await expect(page.locator("#reportPanel")).not.toContainText(privateMacPath);
});

test("commercial sample promotes proprietary engine startup route", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "自研样例" }).click();

  await expect(page.locator("#projectTitle")).toHaveText("AsterCompanyGame");
  await expect(page.locator("#launchPanel")).toContainText("AsterTrial.exe");
  await expect(page.locator("#launchPanel")).toContainText("主推商业/自研引擎路线");

  await page.locator('[data-tab="environment"]').click();
  await expect(page.locator("#environmentPanel")).toContainText("商业/自研引擎启动链");
  await expect(page.locator("#environmentPanel")).toContainText("不要单独复制 exe");

  await page.locator('[data-tab="engine"]').click();
  await expect(page.locator("#enginePanel")).toContainText("引擎/文件结构线索");
  await expect(page.locator("#enginePanel")).toContainText("商业/自研引擎（文件结构）");
  await expect(page.locator("#enginePanel")).toContainText("data02.pak");
  await expect(page.locator("#enginePanel")).toContainText("movie.cpk");
  await expect(page.locator("#enginePanel")).toContainText("graphics.gxp");
  await expect(page.locator("#enginePanel")).toContainText("MovieRuntime.dll");
  await expect(page.locator("#enginePanel")).toContainText("为什么命中");
  await expect(page.locator("#enginePanel")).toContainText("commercial resource archive family");
  await expect(page.locator("#enginePanel")).toContainText("下一步");

  await page.locator('[data-tab="roadmap"]').click();
  await expect(page.locator(".roadmap-list")).toContainText("商业/自研引擎启动链");
});

test("desktop runtime assistant records local environment checks", async ({ page }) => {
  await page.addInitScript(() => {
    window.__environmentChecks = 0;
    window.galaidDesktop = {
      platform: "win32",
      selectFolder: async () => ({ canceled: true, files: [] }),
      selectFiles: async () => ({ canceled: true, files: [] }),
      scanPaths: async () => ({ canceled: true, files: [] }),
      launchEntry: async () => ({ ok: true }),
      createShortcut: async () => ({ ok: true }),
      preparePackage: async () => ({ ok: false }),
      unmountImage: async () => ({ ok: true }),
      getLaunchHistory: async () => [],
      recognizeErrorImage: async () => ({ canceled: true }),
      checkEnvironment: async () => {
        window.__environmentChecks += 1;
        if (window.__environmentChecks > 1) {
          return {
            ok: true,
            platform: "win32",
            checkedAt: "2026-05-17T00:05:00.000Z",
            summary: {
              status: "good",
              label: "本机环境检测没有发现明显缺口",
              detail: "如果游戏仍启动失败，继续结合报错截图、路径和游戏完整性排查。",
              counts: { good: 5, warning: 0, info: 3 },
            },
            checks: [
              {
                id: "directx-native",
                title: "DirectX 旧组件",
                status: "good",
                statusLabel: "OK",
                detail: "检测到常见 DirectX 9 时代 DLL。",
                action: "如果仍黑屏，继续结合报错文字排查。",
                evidence: ["d3dx9_43.dll (System32)"],
              },
              {
                id: "directplay-native",
                title: "DirectPlay 旧版组件",
                status: "good",
                statusLabel: "OK",
                detail: "检测到 Windows DirectPlay 旧版组件已启用。",
                action: "如果仍提示 DirectPlay，继续检查游戏目录完整性和启动入口。",
                evidence: ["DirectPlay=Enabled"],
              },
              {
                id: "vcredist-native",
                title: "VC++ 运行库",
                status: "good",
                statusLabel: "OK",
                detail: "检测到已安装的 Microsoft Visual C++ Redistributable。",
                action: "如果报错点名某个 DLL，按报错年份补对应 x86/x64 版本。",
                evidence: ["Microsoft Visual C++ 2015-2022 Redistributable (x86)"],
              },
              {
                id: "dotnet-native",
                title: ".NET Framework",
                status: "good",
                statusLabel: "OK",
                detail: "检测到 .NET Framework 安装线索。",
                action: "如果报错指定 .NET 版本，按报错版本补对应 .NET Framework。",
                evidence: [".NET Framework 4.8"],
              },
              {
                id: "vb6-native",
                title: "VB6 运行库",
                status: "good",
                statusLabel: "OK",
                detail: "检测到 VB6 运行库 msvbvm60.dll。",
                action: "如果仍提示 msvbvm60.dll，确认游戏没有加载到错误架构。",
                evidence: ["msvbvm60.dll (SysWOW64)"],
              },
              {
                id: "quicktime-native",
                title: "QuickTime/旧视频组件",
                status: "info",
                statusLabel: "观察",
                detail: "没有检测到 QuickTime。",
                action: "遇到 QuickTime 或片头视频黑屏时，再处理这一项。",
                evidence: [],
              },
              {
                id: "rtp-native",
                title: "RPG Maker RTP",
                status: "info",
                statusLabel: "观察",
                detail: "没有检测到 RPG Maker RTP。",
                action: "如果启动时报 RTP/RGSS，再处理这一项。",
                evidence: [],
              },
              {
                id: "locale-native",
                title: "日区与系统区域",
                status: "info",
                statusLabel: "观察",
                detail: "当前 Windows 文化或系统区域未显示为日语。",
                action: "只有出现乱码或启动即退时，再尝试日区环境。",
                evidence: ["CurrentCulture=zh-CN"],
              },
            ],
          };
        }
        return {
          ok: true,
          platform: "win32",
          checkedAt: "2026-05-17T00:00:00.000Z",
          summary: {
            status: "warning",
            label: "3 个本机环境建议项",
            detail: "遇到 d3dx/xinput 报错时，优先补 DirectX End-User Runtime。",
            counts: { good: 1, warning: 3, info: 4 },
          },
          checks: [
            {
              id: "directx-native",
              title: "DirectX 旧组件",
              status: "warning",
              statusLabel: "建议处理",
              detail: "没有检测到常见 DirectX 9 时代 DLL。",
              action: "遇到 d3dx、xinput 相关报错时，优先补 DirectX End-User Runtime。",
              evidence: [],
            },
            {
              id: "directplay-native",
              title: "DirectPlay 旧版组件",
              status: "info",
              statusLabel: "观察",
              detail: "Windows DirectPlay 旧版组件当前未启用；只有报错点名 DirectPlay、dplayx 或 dpnet 时才需要处理。",
              action: "遇到 DirectPlay、dplayx.dll 或 dpnet.dll 报错时，在 Windows 功能里启用 Legacy Components / DirectPlay 后重试。",
              evidence: ["DirectPlay=Disabled"],
            },
            {
              id: "vcredist-native",
              title: "VC++ 运行库",
              status: "good",
              statusLabel: "OK",
              detail: "检测到已安装的 Microsoft Visual C++ Redistributable。",
              action: "如果报错点名某个 DLL，按报错年份补对应 x86/x64 版本。",
              evidence: ["Microsoft Visual C++ 2015-2022 Redistributable (x86)"],
            },
            {
              id: "dotnet-native",
              title: ".NET Framework",
              status: "warning",
              statusLabel: "建议处理",
              detail: "没有在常见注册表位置检测到 .NET Framework。",
              action: "遇到 mscoree、CLR 或 .NET Framework 报错时，优先安装对应 .NET Framework。",
              evidence: [],
            },
            {
              id: "vb6-native",
              title: "VB6 运行库",
              status: "warning",
              statusLabel: "建议处理",
              detail: "没有检测到 msvbvm60.dll。",
              action: "遇到 msvbvm60.dll 或 Visual Basic 6 相关报错时，补齐 VB6 运行库后重试。",
              evidence: [],
            },
            {
              id: "quicktime-native",
              title: "QuickTime/旧视频组件",
              status: "info",
              statusLabel: "观察",
              detail: "没有检测到 QuickTime。",
              action: "遇到 QuickTime、qtmlclient.dll、mciqtz32 或片头视频黑屏时，再补对应视频组件。",
              evidence: [],
            },
            {
              id: "rtp-native",
              title: "RPG Maker RTP",
              status: "info",
              statusLabel: "观察",
              detail: "没有检测到 RPG Maker RTP。",
              action: "如果启动时报 RTP/RGSS，再处理这一项。",
              evidence: [],
            },
            {
              id: "locale-native",
              title: "日区与系统区域",
              status: "info",
              statusLabel: "观察",
              detail: "当前 Windows 文化或系统区域未显示为日语。",
              action: "只有出现乱码或启动即退时，再尝试日区环境。",
              evidence: ["CurrentCulture=zh-CN"],
            },
          ],
        };
      },
      onScanProgress: () => () => {},
      onPrepareProgress: () => () => {},
      onOcrProgress: () => () => {},
    };
  });
  await page.goto("/");
  await page.getByRole("button", { name: "游戏样例" }).click();

  await page.locator('[data-tab="environment"]').click();
  await expect(page.getByRole("button", { name: "检测本机环境" })).toBeVisible();
  await page.getByRole("button", { name: "检测本机环境" }).click();
  await page.waitForFunction(() => window.__environmentChecks === 1);

  await expect(page.locator("#environmentPanel")).toContainText("3 个本机环境建议项");
  await expect(page.locator("#environmentPanel")).toContainText("DirectPlay 旧版组件");
  await expect(page.locator("#environmentPanel")).toContainText("Microsoft Visual C++ 2015-2022 Redistributable");
  await expect(page.locator("#environmentPanel")).toContainText(".NET Framework");
  await expect(page.locator("#environmentPanel")).toContainText("VB6 运行库");

  await page.locator('[data-tab="roadmap"]').click();
  await expect(page.locator(".roadmap-list")).toContainText("本机检测：没有检测到常见 DirectX 9 时代 DLL。");
  await expect(page.locator(".roadmap-list")).toContainText("遇到 d3dx、xinput 相关报错时");
  await expect(page.locator(".roadmap-list")).not.toContainText("本机检测：没有在常见注册表位置检测到 .NET Framework。");
  await expect(page.locator(".roadmap-list")).not.toContainText("补齐 VB6 运行库后重试");

  await page.locator('[data-tab="environment"]').click();
  await page.getByRole("button", { name: "检测本机环境" }).click();
  await page.waitForFunction(() => window.__environmentChecks === 2);
  await page.locator('[data-tab="roadmap"]').click();
  await expect(page.locator(".roadmap-list")).not.toContainText("本机检测：没有检测到常见 DirectX 9 时代 DLL。");
  await expect(page.locator(".roadmap-list")).not.toContainText("本机检测：没有检测到 msvbvm60.dll。");

  await page.locator('[data-tab="support"]').click();
  await expect(page.locator(".support-file-list")).toContainText("desktop-environment.json");
  await expect(page.locator(".support-preview")).toContainText("本机运行环境助手");

  await page.locator('[data-tab="report"]').click();
  await expect(page.locator("#reportPanel")).toContainText("## 本机运行环境助手");
  await expect(page.locator("#reportPanel")).toContainText("DirectX 旧组件");
  await expect(page.locator("#reportPanel")).toContainText("DirectPlay 旧版组件");
});

test("interface and assistant output language can switch to English and Japanese", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("界面/诊断语言")).toBeVisible();
  await page.getByRole("button", { name: "游戏样例" }).click();
  await page.locator("#assistantLanguageSelect").selectOption("en");

  await expect(page.getByRole("button", { name: "Choose folder" })).toBeVisible();
  await expect(page.getByText("Interface / diagnosis language")).toBeVisible();
  await expect(page.locator("#errorInput")).toHaveAttribute("placeholder", /dplayx\.dll/);
  await expect(page.locator('[data-tab="roadmap"]')).toHaveText("Roadmap");
  await expect(page.locator(".summary-strip small").first()).toHaveText("files");
  await page.locator('[data-tab="profiles"]').click();
  await expect(page.locator("#profilesPanel")).toContainText("If Locale Emulator is installed locally");
  await page.locator('[data-tab="engine"]').click();
  await expect(page.locator("#enginePanel")).toContainText("Next step");
  await expect(page.locator("#enginePanel")).toContainText("Try the root launcher first");

  await page.locator('[data-tab="report"]').click();

  await expect(page.locator("#reportPanel")).toContainText("Assistant language: English");
  await expect(page.locator("#reportPanel")).toContainText("## Environment checks");
  await page.locator('[data-tab="environment"]').click();
  await expect(page.locator("#environmentPanel")).toContainText("legacy DirectX files, DirectPlay");

  await page.locator('[data-tab="support"]').click();
  await expect(page.getByRole("heading", { name: "Support bundle" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy chat help" })).toBeVisible();
  await expect(page.locator(".support-preview")).toContainText("## GalAid support summary");
  await expect(page.locator(".support-preview")).toContainText("Recommended entry");

  await page.locator("#assistantLanguageSelect").selectOption("ja");
  await expect(page.getByRole("button", { name: "フォルダを選択" })).toBeVisible();
  await expect(page.getByText("UI / 診断言語")).toBeVisible();
  await expect(page.locator("#errorInput")).toHaveAttribute("placeholder", /dplayx\.dll/);
  await expect(page.locator('[data-tab="roadmap"]')).toHaveText("手順");
  await expect(page.locator(".summary-strip small").first()).toHaveText("ファイル");
  await page.locator('[data-tab="engine"]').click();
  await expect(page.locator("#enginePanel")).toContainText("次の手順");
  await expect(page.locator("#enginePanel")).toContainText("まずルートフォルダの起動ファイル");
  await page.locator('[data-tab="environment"]').click();
  await expect(page.locator("#environmentPanel")).toContainText("古い DirectX、DirectPlay");
  await page.locator('[data-tab="support"]').click();
  await expect(page.getByRole("heading", { name: "サポートバンドル" })).toBeVisible();
  await expect(page.getByRole("button", { name: "チャット用文面をコピー" })).toBeVisible();
  await expect(page.locator(".support-preview")).toContainText("## GalAid サポート概要");
  await expect(page.locator(".support-preview")).toContainText("診断言語: 日本語");
});

test("error screenshot OCR text feeds the recipe matcher", async ({ page }) => {
  await page.addInitScript(() => {
    window.Tesseract = {
      recognize: async () => ({
        data: {
          text: "The program cannot start because d3dx9_43.dll is missing.",
        },
      }),
    };
  });
  await page.goto("/");

  await page.getByRole("button", { name: "游戏样例" }).click();
  await page.setInputFiles("#ocrImageInput", {
    name: "startup-error.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lZHdJwAAAABJRU5ErkJggg==",
      "base64",
    ),
  });

  await expect(page.locator("#ocrStatus")).toHaveText("已填入截图文字");
  await expect(page.locator("#errorInput")).toHaveValue(/OCR: startup-error\.png/);
  await page.locator('[data-tab="errors"]').click();
  await expect(page.locator("#errorsPanel")).toContainText("DirectX 旧组件");
});
