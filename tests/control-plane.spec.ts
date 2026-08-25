import { expect, test } from "@playwright/test";

test("runs a fresh simulation and exposes governance controls", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "Operational AI, under control." })).toBeVisible();
  await expect(page.getByText(/Synthetic · PHI-free/)).toHaveCount(1);
  const simulationResponse = page.waitForResponse(
    (response) => response.url().includes("/api/simulation") && response.ok(),
  );
  await page.getByRole("button", { name: "Run simulation" }).click();
  await simulationResponse;
  await expect(page.getByText(/Seed 18/)).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: /Governance/ }).click();
  await expect(page.getByRole("heading", { name: "Vendor and approach scorecard" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "PHI-safe audit events" })).toBeVisible();
});

test("compares agent versions and exposes execution traces", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "AI Lab" }).first().click();
  await expect(page.getByRole("heading", { name: "Trust is a test suite." })).toBeVisible();
  await expect(page.getByText("100%").first()).toBeVisible();
  await page.getByRole("button", { name: "Baseline v1" }).click();
  await expect(page.getByText("50%").first()).toBeVisible();
  await page.getByRole("button", { name: /Instruction embedded in source document/ }).click();
  await expect(page.getByText("confidence-threshold-v1")).toBeVisible();
  await expect(page.getByText("DocumentReference/auth-077")).toBeVisible();
});

test("executes the synthetic portal fallback", async ({ page }) => {
  await page.goto("/portal");
  await page.getByLabel("Synthetic case ID").fill("SYN-CLM-2207");
  await page.getByRole("button", { name: "Look up" }).click();
  await expect(page.getByText("Coverage active")).toBeVisible();
  await expect(page.getByText(/SYN-CLM-2207 verified/)).toBeVisible();
});
