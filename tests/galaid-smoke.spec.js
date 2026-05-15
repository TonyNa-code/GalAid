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

  const recipeCount = await page.evaluate(() => window.GALAID_ERROR_RECIPES.length);
  expect(recipeCount).toBeGreaterThanOrEqual(11);

  await page.locator('[data-tab="support"]').click();
  await expect(page.getByRole("heading", { name: "求助包" })).toBeVisible();
  await expect(page.locator(".support-file-list")).toContainText("roadmap.json");
  await expect(page.locator(".support-file-list")).toContainText("roadmap-checklist.md");
  await expect(page.locator(".support-privacy-list")).toContainText("不包含游戏文件");
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
