import { expect, test as setup } from "@playwright/test";

setup("sign in with the test passcode", async ({ page }) => {
  await page.goto("/login");
  await page.locator("input[name=passcode]").fill("e2e-passcode");
  await page.keyboard.press("Enter");
  await expect(page).not.toHaveURL(/\/login/);
  await page.context().storageState({ path: "e2e/.tmp/session.json" });
});
