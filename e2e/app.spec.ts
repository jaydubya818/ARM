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
});
