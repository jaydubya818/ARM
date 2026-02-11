import { test, expect } from "@playwright/test";

test.describe("ARM Application", () => {
  test("loads and shows ARM branding", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("ARM")).toBeVisible();
    await expect(page.getByText("Agent Resource Management")).toBeVisible();
  });

  test("sidebar navigation works", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Directory/i }).click();
    await expect(page).toHaveURL(/\/directory/);
  });

  test("monitoring page loads", async ({ page }) => {
    await page.goto("/monitoring");
    await expect(
      page.getByRole("heading", { name: /System Monitoring/i })
    ).toBeVisible();
  });

  test("incidents page loads", async ({ page }) => {
    await page.goto("/incidents");
    await expect(page.getByRole("heading", { name: /Incidents/i })).toBeVisible();
  });

  test("cost page loads", async ({ page }) => {
    await page.goto("/cost");
    await expect(page.getByRole("heading", { name: /Cost Management/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Record Cost/i })).toBeVisible();
  });

  test("federation page loads", async ({ page }) => {
    await page.goto("/federation");
    await expect(page.getByRole("heading", { name: /Federation/i })).toBeVisible();
  });
});
