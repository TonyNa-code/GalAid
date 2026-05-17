const { test, expect } = require("@playwright/test");

test("sample diagnosis renders roadmap and support bundle metadata", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/GalAid/);
  await expect(page.locator("#launchPanel .empty-flow")).toContainText("拖进来");
  await expect(page.locator("#launchPanel .empty-flow")).toContainText("一键启动");
  await page.getByRole("button", { name: "游戏样例" }).click();
  await page.locator("#errorInput").fill("The program cannot start because d3dx9_43.dll is missing. VCRUNTIME140.dll was not found.");
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
  await expect(page.locator(".support-file-list")).toContainText("file-manifest.json");
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
  await expect(packagesPanel).toContainText("CCD/IMG disc image");
  await expect(packagesPanel).toContainText("MDS/MDF disc image");
  await expect(packagesPanel).toContainText("BlindWrite 6 disc image");
  await expect(packagesPanel).toContainText("古早镜像已识别");
  await expect(page.locator(".package-roadmap")).toContainText("包里看到启动线索");
  await expect(page.locator(".package-roadmap")).toContainText("包内有运行库修复项");
  await expect(page.locator(".package-roadmap")).toContainText("识别到古早镜像格式");
  await expect(page.locator("main")).toContainText("Blocked");

  await page.locator('[data-tab="roadmap"]').click();
  await expect(page.locator(".roadmap-step").first()).toContainText("先处理压缩包或镜像");
  await expect(page.locator(".roadmap-step").first()).toContainText("解压/挂载并重扫");

  await page.locator('[data-tab="support"]').click();
  await expect(page.locator(".support-file-list")).toContainText("file-manifest.json");

  await page.locator("#assistantLanguageSelect").selectOption("en");
  await page.locator('[data-tab="report"]').click();
  await expect(page.locator("#reportPanel")).toContainText("## Next-step roadmap");

  await page.locator('[data-tab="launch"]').click();
  await expect(page.locator(".one-stop-wizard")).toContainText("Handle packages/images");
  await expect(page.getByRole("heading", { name: "No launch candidate" })).toBeVisible();
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
  await page.goto("/");

  await page.getByRole("button", { name: "游戏样例" }).click();
  await expect(page.getByRole("heading", { name: "启动失败了吗？" }).first()).toBeVisible();
  await expect(page.locator(".failure-triage")).toContainText("快速问诊");

  await page.locator('[data-failure-triage-question="visible-result"][data-failure-triage-option="dialog-text"]').check();
  await page.locator('[data-failure-triage-question="source-state"][data-failure-triage-option="from-package"]').check();
  await page.locator('[data-failure-triage-question="error-capture"][data-failure-triage-option="can-copy"]').check();
  await page.locator('[data-failure-symptom="missing-dll"]').check();
  await page.locator("[data-failure-note]").fill("VCRUNTIME140.dll was not found");
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

  await page.locator('[data-tab="report"]').click();
  await expect(page.locator("#reportPanel")).toContainText("## 启动失败跟进");
  await expect(page.locator("#reportPanel")).toContainText("问诊答案");
  await expect(page.locator("#reportPanel")).toContainText("缺 DLL/运行库");
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
              counts: { good: 2, warning: 0, info: 0 },
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
                id: "vcredist-native",
                title: "VC++ 运行库",
                status: "good",
                statusLabel: "OK",
                detail: "检测到已安装的 Microsoft Visual C++ Redistributable。",
                action: "如果报错点名某个 DLL，按报错年份补对应 x86/x64 版本。",
                evidence: ["Microsoft Visual C++ 2015-2022 Redistributable (x86)"],
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
            label: "1 个本机环境建议项",
            detail: "遇到 d3dx/xinput 报错时，优先补 DirectX End-User Runtime。",
            counts: { good: 2, warning: 1, info: 1 },
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
              id: "vcredist-native",
              title: "VC++ 运行库",
              status: "good",
              statusLabel: "OK",
              detail: "检测到已安装的 Microsoft Visual C++ Redistributable。",
              action: "如果报错点名某个 DLL，按报错年份补对应 x86/x64 版本。",
              evidence: ["Microsoft Visual C++ 2015-2022 Redistributable (x86)"],
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

  await expect(page.locator("#environmentPanel")).toContainText("1 个本机环境建议项");
  await expect(page.locator("#environmentPanel")).toContainText("Microsoft Visual C++ 2015-2022 Redistributable");

  await page.locator('[data-tab="roadmap"]').click();
  await expect(page.locator(".roadmap-list")).toContainText("本机检测：没有检测到常见 DirectX 9 时代 DLL。");
  await expect(page.locator(".roadmap-list")).toContainText("遇到 d3dx、xinput 相关报错时");

  await page.locator('[data-tab="environment"]').click();
  await page.getByRole("button", { name: "检测本机环境" }).click();
  await page.waitForFunction(() => window.__environmentChecks === 2);
  await page.locator('[data-tab="roadmap"]').click();
  await expect(page.locator(".roadmap-list")).not.toContainText("本机检测：没有检测到常见 DirectX 9 时代 DLL。");

  await page.locator('[data-tab="support"]').click();
  await expect(page.locator(".support-file-list")).toContainText("desktop-environment.json");
  await expect(page.locator(".support-preview")).toContainText("本机运行环境助手");

  await page.locator('[data-tab="report"]').click();
  await expect(page.locator("#reportPanel")).toContainText("## 本机运行环境助手");
  await expect(page.locator("#reportPanel")).toContainText("DirectX 旧组件");
});

test("interface and assistant output language can switch to English and Japanese", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("界面/诊断语言")).toBeVisible();
  await page.getByRole("button", { name: "游戏样例" }).click();
  await page.locator("#assistantLanguageSelect").selectOption("en");

  await expect(page.getByRole("button", { name: "Choose folder" })).toBeVisible();
  await expect(page.getByText("Interface / diagnosis language")).toBeVisible();
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

  await page.locator('[data-tab="support"]').click();
  await expect(page.getByRole("heading", { name: "Support bundle" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy chat help" })).toBeVisible();
  await expect(page.locator(".support-preview")).toContainText("## GalAid support summary");
  await expect(page.locator(".support-preview")).toContainText("Recommended entry");

  await page.locator("#assistantLanguageSelect").selectOption("ja");
  await expect(page.getByRole("button", { name: "フォルダを選択" })).toBeVisible();
  await expect(page.getByText("UI / 診断言語")).toBeVisible();
  await expect(page.locator('[data-tab="roadmap"]')).toHaveText("手順");
  await expect(page.locator(".summary-strip small").first()).toHaveText("ファイル");
  await page.locator('[data-tab="engine"]').click();
  await expect(page.locator("#enginePanel")).toContainText("次の手順");
  await expect(page.locator("#enginePanel")).toContainText("まずルートフォルダの起動ファイル");
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
