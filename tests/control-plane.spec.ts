import { expect, test } from "@playwright/test";

test("runs a fresh simulation and exposes governance controls", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "ClinicOps AI Control Plane" })).toBeVisible();
  await expect(page.getByText("Synthetic, PHI-free simulation")).toHaveCount(1);
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

test("executes the synthetic portal fallback", async ({ page }) => {
  await page.goto("/portal");
  await page.getByLabel("Synthetic case ID").fill("SYN-CLM-2207");
  await page.getByRole("button", { name: "Look up" }).click();
  await expect(page.getByText("Coverage active")).toBeVisible();
  await expect(page.getByText(/SYN-CLM-2207 verified/)).toBeVisible();
});
