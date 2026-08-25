import { expect, test } from "@playwright/test";

test("captures the responsive control room", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("region", { name: "Key metrics" })).toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
  await page.screenshot({
    path: `docs/screenshots/${testInfo.project.name}.png`,
    fullPage: true,
  });
});
