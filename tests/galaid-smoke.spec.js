const { test, expect } = require("@playwright/test");

test("sample diagnosis renders roadmap and support bundle metadata", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/GalAid/);
  await page.getByRole("button", { name: "游戏样例" }).click();
  await page.getByLabel("错误信息").fill("The program cannot start because d3dx9_43.dll is missing. VCRUNTIME140.dll was not found.");
  await page.locator('[data-tab="roadmap"]').click();

  await expect(page.locator("#projectTitle")).toHaveText("SakuraTrial");
  await expect(page.locator(".roadmap-summary h4")).toHaveText("4 个建议步骤");
  await expect(page.locator(".roadmap-step h4").filter({ hasText: "DirectX 旧组件" })).toBeVisible();
  await expect(page.locator(".roadmap-step h4").filter({ hasText: "VC++ 运行库" })).toBeVisible();
  await page.locator('[data-tab="launch"]').click();
  await expect(page.locator("#launchPanel .finding-evidence").first()).toContainText("判断依据");
  await expect(page.locator("#launchPanel .finding-evidence").first()).toContainText("SakuraTrial/game.exe");
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
  await expect(page.locator(".support-file-list")).toContainText("roadmap.json");
  await expect(page.locator(".support-file-list")).toContainText("roadmap-checklist.md");
  await expect(page.locator(".support-file-list")).toContainText("file-manifest.json");
  await expect(page.locator(".support-privacy-list")).toContainText("不包含游戏文件");
  await expect(page.locator(".support-privacy-list")).toContainText("包/镜像只预检元数据");

  const supportPreview = page.locator(".support-preview");
  await expect(supportPreview).toContainText("## GalAid 求助摘要");
  await expect(supportPreview).toContainText("SakuraTrial");
  await expect(supportPreview).toContainText("DirectX 旧组件");
});

test("package sample shows archive and image preflight without treating it as runnable", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "包/镜像样例" }).click();
  await page.locator('[data-tab="packages"]').click();

  const packagesPanel = page.locator("#packagesPanel");
  await expect(packagesPanel).toContainText("ZIP 目录预检");
  await expect(packagesPanel).toContainText("SnowTrial/Game.exe");
  await expect(packagesPanel).toContainText("KiriKiri / 吉里吉里");
  await expect(packagesPanel).toContainText("RAR 包/镜像预检");
  await expect(packagesPanel).toContainText("MoonlightCafe/Game.exe");
  await expect(packagesPanel).toContainText("ISO disc image 包/镜像预检");
  await expect(page.locator(".package-roadmap")).toContainText("包里看到启动线索");
  await expect(page.locator("main")).toContainText("Blocked");

  await page.locator('[data-tab="launch"]').click();
  await expect(page.getByRole("heading", { name: "没有候选入口" })).toBeVisible();
});

test("launch failure follow-up updates roadmap and support bundle", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "游戏样例" }).click();
  await expect(page.getByRole("heading", { name: "启动失败了吗？" }).first()).toBeVisible();

  await page.locator('[data-failure-symptom="missing-dll"]').check();
  await page.locator("[data-failure-note]").fill("VCRUNTIME140.dll was not found");
  await page.getByRole("button", { name: "更新路线" }).click();

  await expect(page.locator("#launchPanel")).toContainText("已记录 2 条现象");
  await page.locator('[data-tab="roadmap"]').click();
  await expect(page.locator(".roadmap-list")).toContainText("缺 DLL/运行库");
  await expect(page.locator(".roadmap-list")).toContainText("VC++ 运行库");

  await page.locator('[data-tab="support"]').click();
  await expect(page.locator(".support-file-list")).toContainText("launch-failure.json");
  await expect(page.locator(".support-preview")).toContainText("启动失败跟进");
  await expect(page.locator(".support-preview")).toContainText("VCRUNTIME140.dll was not found");

  await page.locator('[data-tab="report"]').click();
  await expect(page.locator("#reportPanel")).toContainText("## 启动失败跟进");
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
  await expect(page.locator("#enginePanel")).toContainText("MovieRuntime.dll");
  await expect(page.locator("#enginePanel")).toContainText("为什么命中");
  await expect(page.locator("#enginePanel")).toContainText("commercial resource archive family");
  await expect(page.locator("#enginePanel")).toContainText("下一步");

  await page.locator('[data-tab="roadmap"]').click();
  await expect(page.locator(".roadmap-list")).toContainText("商业/自研引擎启动链");
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
  await expect(page.locator("#profilesPanel")).toContainText("Use only with a trusted local Locale Emulator install");
  await page.locator('[data-tab="engine"]').click();
  await expect(page.locator("#enginePanel")).toContainText("Next step");
  await expect(page.locator("#enginePanel")).toContainText("Try the root launcher first");

  await page.locator('[data-tab="report"]').click();

  await expect(page.locator("#reportPanel")).toContainText("Assistant language: English");
  await expect(page.locator("#reportPanel")).toContainText("## Environment checks");

  await page.locator('[data-tab="support"]').click();
  await expect(page.getByRole("heading", { name: "Support bundle" })).toBeVisible();
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
  await expect(page.locator(".support-preview")).toContainText("## GalAid サポート概要");
  await expect(page.locator(".support-preview")).toContainText("診断言語: 日本語");
});
