import { chromium } from "@playwright/test";

const ARTIFACTS_DIR = "/Users/alifiroozi/.gemini/antigravity/brain/0a1b4a6c-d29e-4f6b-af41-0b61032757ff";

async function main() {
  const browser = await chromium.launch({
    headless: true,
    channel: "chrome",
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    locale: "fa-IR",
  });
  const page = await context.newPage();

  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
  page.on("response", (res) => {
    if (res.url().includes("/api/")) {
      console.log("API RESP:", res.status(), res.url());
    }
  });

  console.log("Navigating to http://localhost:3000/admin/login...");
  await page.goto("http://localhost:3000/admin/login", { waitUntil: "domcontentloaded" });

  // Fill credentials
  await page.fill('input[type="text"], input[name="username"]', "admin@karaan.ir");
  await page.fill('input[type="password"]', "KarAan@Admin2026!");
  await page.click('button[type="submit"]');
  
  // Wait for navigation or admin page
  await page.waitForURL("**/admin", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(3000);

  // Wait for users table to have rows
  await page.waitForSelector('table tbody tr', { timeout: 10000 }).catch((e) => console.log("Wait for tr:", e.message));

  // 1. Capture Main Dashboard Overview
  await page.screenshot({
    path: `${ARTIFACTS_DIR}/dashboard_roles_overview.png`,
    fullPage: false,
  });
  console.log("Saved dashboard_roles_overview.png");

  // 2. Open Employer modal (مهندس آرش رادمنش)
  const employerRow = page.locator('tr:has-text("مهندس آرش رادمنش")');
  if (await employerRow.count() > 0) {
    await employerRow.first().locator('button:has-text("شناسنامه")').click();
    await page.waitForTimeout(1000);

    // Switch to REQUESTS tab
    await page.click('button:has-text("درخواست‌ها")');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: `${ARTIFACTS_DIR}/dashboard_employer_approved_request.png`,
      fullPage: false,
    });
    console.log("Saved dashboard_employer_approved_request.png");

    // Close modal using close button
    await page.click('button:has-text("بستن پنجره")');
    await page.waitForTimeout(1000);
  }

  // 3. Open Worker modal (علی فیروزی)
  const workerRow = page.locator('tr:has-text("علی فیروزی")');
  if (await workerRow.count() > 0) {
    await workerRow.first().locator('button:has-text("شناسنامه")').click();
    await page.waitForTimeout(1000);

    // Capture Profile & Verification
    await page.screenshot({
      path: `${ARTIFACTS_DIR}/dashboard_worker_verified_profile.png`,
      fullPage: false,
    });
    console.log("Saved dashboard_worker_verified_profile.png");

    // Switch to REQUESTS tab
    await page.click('button:has-text("درخواست‌ها")');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: `${ARTIFACTS_DIR}/dashboard_worker_service_request.png`,
      fullPage: false,
    });
    console.log("Saved dashboard_worker_service_request.png");

    // Close modal
    await page.keyboard.press("Escape");
  }

  await browser.close();
  console.log("All screenshots captured successfully!");
}

main().catch((err) => {
  console.error("Error in capture script:", err);
  process.exit(1);
});
