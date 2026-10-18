import { expect, test, type Page } from "@playwright/test";

// names carry the run's time, so a rerun on a database that survived never matches an older row
const tag = Date.now().toString(36);

/** Opens a page and waits until it's ready to click: a click before React takes over the page does nothing. */
async function open(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

async function quickAdd(page: Page, text: string) {
  const input = page.getByPlaceholder(/Add a task/);
  await input.fill(text);
  await input.press("Enter");
  await expect(input).toHaveValue("");
}

test("quick add puts a task in its project", async ({ page }) => {
  await open(page, "/");
  await quickAdd(page, `Write the e2e notes ${tag} #ot`);
  await open(page, "/w/softsora/ot");
  await expect(page.getByRole("link", { name: `Write the e2e notes ${tag}` })).toBeVisible();
});

test("a code task goes from dev released to a shipped release", async ({ page }) => {
  const title = `Ship the export ${tag}`;
  await open(page, "/w/softsora/gk");
  await quickAdd(page, `${title} #gk @code`);
  await page.reload();
  await page.waitForLoadState("networkidle");

  await page.getByLabel(`Stage of ${title}`).selectOption("dev_released");
  await page.reload();
  await page.waitForLoadState("networkidle");
  const ready = page.getByRole("region", { name: "Ready to ship" });
  await expect(ready.getByText(title)).toBeVisible();

  await ready.getByRole("checkbox", { name: new RegExp(title) }).check();
  await ready.getByLabel(/Release name|Name/).fill(`v-${tag}`);
  await ready.getByRole("button", { name: /Ship 1 to production/ }).click();

  const history = page.getByRole("region", { name: "Release history" });
  await expect(history.getByText(`v-${tag}`)).toBeVisible();
  await expect(ready.getByText(title)).toHaveCount(0);
});

test("ticking a routine item on Today sticks", async ({ page }) => {
  await open(page, "/");
  // which routines show depends on the weekday. Ticking the last item of a routine folds it to "Done", so prefer one with
  // two or more items to tick (the deep-task item ticks itself, so it doesn't count)
  const tickable = '[role="checkbox"]:not([aria-disabled="true"])';
  const routines = page.locator('section[aria-labelledby^="routine-"]');
  let routine = routines.first();
  for (const r of await routines.all()) {
    if ((await r.locator(tickable).count()) >= 2) {
      routine = r;
      break;
    }
  }
  const name = (await routine.locator(tickable).first().textContent())!;
  const item = () => routine.getByRole("checkbox", { name, exact: true });
  const ticked = () =>
    item()
      .and(page.locator('[aria-checked="true"]'))
      .or(routine.getByRole("button", { name: /Done/ }));

  await item().click();
  await expect(ticked()).toBeVisible();
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(ticked()).toBeVisible();
});

test("a subscription can be added, paid and the payment undone", async ({ page }) => {
  const name = `Hosting ${tag}`;
  await open(page, "/subscriptions");
  await page.getByRole("button", { name: "Add a subscription" }).click();
  const form = page.getByRole("group", { name: "New subscription" });
  await form.getByLabel("Service").fill(name);
  await form.getByLabel("Price").fill("12.50");
  await form.getByRole("button", { name: "Add" }).click();

  // a new subscription renews today by default, so it's due and shows Paid
  await page.getByRole("button", { name: `Mark ${name} paid` }).click();
  await expect(page.getByRole("button", { name: `Mark ${name} paid` })).toHaveCount(0);

  await page.getByText(/Payment history/).click();
  await page.getByRole("button", { name: `Undo the ${name} payment` }).click();
  await expect(page.getByRole("button", { name: `Mark ${name} paid` })).toBeVisible();
});

test("a note is written, saved, filed under a project, pinned, deleted and restored", async ({ page }) => {
  const title = `Launch checklist ${tag}`;
  await open(page, "/notes?f=all");
  await page.getByRole("button", { name: "New note" }).first().click();
  await expect(page.getByLabel("Title")).toBeFocused();
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Title").press("Enter");
  await page.getByLabel("Note", { exact: true }).fill("Ship the export\nTell the client");
  await expect(page.getByText("Saved")).toBeVisible();

  // it survives a reload, and the list shows its title and preview
  await page.reload();
  await page.waitForLoadState("networkidle");
  const row = page.getByRole("link", { name: new RegExp(title) });
  await expect(row).toContainText("Ship the export Tell the client");

  await page.getByLabel("Folder", { exact: true }).selectOption({ label: "Gaku" });
  await open(page, "/notes?f=pr_gaku");
  await row.click();
  await page.getByRole("button", { name: "Pin note" }).click();
  await expect(page.getByRole("button", { name: "Unpin note" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pinned" })).toBeVisible();

  await page.getByRole("button", { name: "Delete note" }).click();
  await expect(row).toHaveCount(0);
  await open(page, "/notes?f=deleted");
  await row.click();
  await page.getByRole("button", { name: "Restore" }).click();
  await open(page, "/notes?f=pr_gaku");
  await expect(row).toBeVisible();

  // and Search finds it
  await open(page, `/search?q=${encodeURIComponent(title)}`);
  await expect(page.getByRole("link", { name: title })).toBeVisible();
});
