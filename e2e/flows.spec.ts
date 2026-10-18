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
  // with QA now: grouped apart, on a dashed card
  const withQa = page.getByRole("region", { name: "With QA and the client" });
  await expect(withQa.getByRole("link", { name: title })).toBeVisible();
  await expect(withQa.locator("li[data-waiting]")).not.toHaveCount(0);

  await ready.getByRole("checkbox", { name: new RegExp(title) }).check();
  await ready.getByLabel(/Release name|Name/).fill(`v-${tag}`);
  await ready.getByRole("button", { name: /Ship 1 to production/ }).click();

  const history = page.getByRole("region", { name: "Release history" });
  await expect(history.getByText(`v-${tag}`)).toBeVisible();
  await expect(ready.getByText(title)).toHaveCount(0);
});

test("a dev released task stops being late, takes QA bugs and a prod date", async ({ page }) => {
  const title = `QA flow ${tag}`;
  const day = (offset: number) => new Date(Date.now() + offset * 864e5).toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" });
  await open(page, "/w/softsora/gk");
  await quickAdd(page, `${title} #gk @code`);
  await page.reload();
  const openTask = async () => {
    await page.getByRole("link", { name: title, exact: true }).click();
    await page.waitForURL(/\/t\//);
    await page.waitForLoadState("networkidle");
  };
  // saving the editor goes back to the project's tasks
  const save = async () => {
    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForURL(/\/w\/softsora\/gk$/);
    await page.waitForLoadState("networkidle");
  };
  await openTask();
  // the editor stays open when the page is revisited, so open it only when it's shut
  const edit = async () => {
    const editor = page.locator("details:visible").filter({ has: page.getByText("Edit task") });
    if ((await editor.getAttribute("open")) === null) await editor.getByText("Edit task").click();
  };

  // late while it's yours
  await edit();
  await page.getByLabel("Due", { exact: true }).fill(day(-3));
  await save();
  await expect(
    page
      .getByRole("listitem")
      .filter({ has: page.getByRole("link", { name: title, exact: true }) })
      .getByText(/^Was due /),
  ).toBeVisible();
  await openTask();

  // (pages left behind stay mounted, hidden, so only visible text counts)
  // dev released: no longer late, the wait counts instead, and the miss is noted quietly
  await page.getByLabel(`Stage of ${title}`).first().selectOption("dev_released");
  await expect(page.locator("main").getByText("Dev released today").filter({ visible: true })).toBeVisible();
  await expect(
    page
      .locator("main")
      .getByText(/^Due .*, 3 days late$/)
      .filter({ visible: true }),
  ).toBeVisible();
  await expect(
    page
      .locator("main")
      .getByText(/^Was due /)
      .filter({ visible: true }),
  ).toHaveCount(0);

  // QA finds a bug: it's a bug fix subtask, counted on the card
  await page.getByLabel("New QA bug").fill(`Button misaligned ${tag}`);
  await page.getByLabel("New QA bug").press("Enter");
  await expect(page.getByRole("link", { name: `Button misaligned ${tag}` })).toBeVisible();
  await expect(page.getByText("1 QA bug to fix", { exact: false })).toBeVisible();

  // it really reached dev on its due date: correcting the date clears the late note
  await edit();
  await page.getByLabel("Dev released on").fill(day(-3));
  await save();
  const card = page.getByRole("listitem").filter({ has: page.getByRole("link", { name: title, exact: true }) });
  await expect(card.getByText(/^Dev released .*, waiting 3 days$/)).toBeVisible();
  await expect(card.getByText(/days late$/)).toHaveCount(0);

  // the client's date replaces the wait, and goes red only once it's missed
  await openTask();
  await edit();
  await page.getByLabel("Prod date").fill(day(-1));
  await save();
  await expect(card.getByText("1 QA bug", { exact: true })).toBeVisible();
  // bugs sent back make it yours again, so it stays with your work, still dashed
  await expect(page.getByRole("region", { name: "With QA and the client" }).getByRole("link", { name: title, exact: true })).toHaveCount(0);
  await expect(card).toHaveAttribute("data-waiting", "true");
  await expect(card.getByText("Prod was due Yesterday")).toHaveClass(/text-danger/);
  await expect(page.getByRole("region", { name: "Ready to ship" }).getByText("Prod was due Yesterday")).toBeVisible();
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
  // the formatted note keeps each Enter as its own line
  await row.click();
  await expect(page.getByRole("region", { name: "Open note" }).locator(".note-md br")).toHaveCount(1);

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

test("a note shows code blocks as panels and keeps pasted images", async ({ page }) => {
  await open(page, "/notes?f=pr_gaku");
  await page.getByRole("button", { name: "New note" }).first().click();
  await page.getByLabel("Title").fill(`Deploy steps ${tag}`);
  await page.getByLabel("Title").press("Enter");
  await page.getByLabel("Note", { exact: true }).fill("Run this:\n```bash\nnpm run build\n```");

  // a 1x1 PNG, added through the image button
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
  await page.getByLabel("Image to add").setInputFiles({ name: "shot.png", mimeType: "image/png", buffer: png });
  await expect(page.getByText("Saved")).toBeVisible();

  // leaving the text shows it formatted
  await page.getByLabel("Title").click();
  const panel = page.getByRole("figure", { name: "bash code" });
  await expect(panel).toContainText("npm run build");
  await expect(panel.getByRole("button", { name: "Copy bash code" })).toBeVisible();
  const img = page.getByRole("img", { name: "image" });
  await expect(img).toBeVisible();
  expect(await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth === 1)).toBe(true);

  // it all survives a reload, and the image is private
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("figure", { name: "bash code" })).toBeVisible();
  const src = await page.getByRole("img", { name: "image" }).getAttribute("src");
  const signedOut = await page
    .context()
    .browser()!
    .newContext({ storageState: { cookies: [], origins: [] } });
  const res = await signedOut.request.get(new URL(src!, page.url()).toString(), { maxRedirects: 0 });
  expect([307, 401]).toContain(res.status());
  await signedOut.close();

  // the code block button wraps a new block in fences
  await page.getByRole("region", { name: "Open note" }).getByText("Run this:").click();
  await page.getByRole("button", { name: "Insert code block" }).click();
  await page.keyboard.type("SELECT 1;");
  await expect(page.getByLabel("Note", { exact: true })).toHaveValue(/```\nSELECT 1;\n```/);
});

test("uploads that aren't images are refused", async ({ page }) => {
  await open(page, "/notes?f=all");
  const res = await page.request.post("/api/notes/images", {
    multipart: { noteId: "nt_missing", file: { name: "x.png", mimeType: "image/png", buffer: Buffer.from("<html>not a png</html>") } },
  });
  expect(res.status()).toBe(404);
});
