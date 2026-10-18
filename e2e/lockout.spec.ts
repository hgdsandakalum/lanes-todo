import { expect, test } from "@playwright/test";

// runs last (see playwright.config.ts): it locks out this machine's address on the test database
test.use({ storageState: { cookies: [], origins: [] } });

test("five wrong passcodes lock sign-in, even for the right one", async ({ page }) => {
  await page.goto("/login");
  const passcode = page.locator("input[name=passcode]");
  // wait for each attempt's answer: the message reads the same after every wrong guess, so it can't tell them apart
  const submit = async (value: string) => {
    await passcode.fill(value);
    await Promise.all([page.waitForResponse((r) => r.request().method() === "POST"), passcode.press("Enter")]);
  };
  for (let i = 0; i < 5; i++) {
    await submit(`wrong-${i}`);
    await expect(page.locator("#login-error")).toHaveText("That passcode is wrong. Try again.");
  }
  await submit("e2e-passcode");
  await expect(page.locator("#login-error")).toHaveText(/Too many wrong passcodes. Try again in 15 minutes./);
  await expect(page).toHaveURL(/\/login/);
});
