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

  const recipeCount = await page.evaluate(() => window.GALAID_ERROR_RECIPES.length);
  expect(recipeCount).toBeGreaterThanOrEqual(11);

  await page.locator('[data-tab="support"]').click();
  await expect(page.getByRole("heading", { name: "求助包" })).toBeVisible();
  await expect(page.locator(".support-file-list")).toContainText("roadmap.json");
  await expect(page.locator(".support-file-list")).toContainText("roadmap-checklist.md");
  await expect(page.locator(".support-privacy-list")).toContainText("不包含游戏文件");
  await expect(page.locator(".support-privacy-list")).toContainText("ZIP 只预检目录");

  const supportPreview = page.locator(".support-preview");
  await expect(supportPreview).toContainText("## GalAid 求助摘要");
  await expect(supportPreview).toContainText("SakuraTrial");
  await expect(supportPreview).toContainText("DirectX 旧组件");
});

test("package sample shows zip directory preview without treating it as runnable", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "包/镜像样例" }).click();
  await page.locator('[data-tab="packages"]').click();

  await expect(page.locator(".archive-preview")).toContainText("ZIP 目录预检");
  await expect(page.locator(".archive-preview")).toContainText("SnowTrial/Game.exe");
  await expect(page.locator(".archive-preview")).toContainText("KiriKiri / 吉里吉里");
  await expect(page.locator(".package-roadmap")).toContainText("压缩包里看到启动线索");

  await page.locator('[data-tab="launch"]').click();
  await expect(page.getByRole("heading", { name: "没有候选入口" })).toBeVisible();
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
  await expect(page.getByRole("heading", { name: "サポートバンドル" })).toBeVisible();
  await expect(page.locator(".support-preview")).toContainText("## GalAid サポート概要");
  await expect(page.locator(".support-preview")).toContainText("診断言語: 日本語");
});
