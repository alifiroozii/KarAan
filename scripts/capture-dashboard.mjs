import { chromium } from "@playwright/test";

async function main() {
  const browser = await chromium.launch({
    headless: true,
    channel: "chrome",
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    locale: "fa-IR",
  });
  const page = await context.newPage();

  console.log("Navigating to /admin/login...");
  await page.goto("http://localhost:3000/admin/login", { waitUntil: "networkidle" });

  // Fill credentials
  await page.fill('input[type="text"], input[name="username"]', "admin@karaan.ir");
  await page.fill('input[type="password"]', "KarAan@Admin2026!");
  
  // Submit login
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);

  // Navigate to /admin
  console.log("Navigating to /admin...");
  await page.goto("http://localhost:3000/admin", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // Take screenshot in Light mode
  await page.screenshot({
    path: "/Users/alifiroozi/.gemini/antigravity/brain/0a1b4a6c-d29e-4f6b-af41-0b61032757ff/admin_user_management_light.png",
    fullPage: false,
  });
  console.log("Saved admin_user_management_light.png");

  // Click on the first "شناسنامه" button to open modal
  const viewButton = page.locator('button:has-text("شناسنامه")').first();
  if (await viewButton.isVisible()) {
    await viewButton.click();
    await page.waitForTimeout(800);
    
    // Screenshot Profile tab
    await page.screenshot({
      path: "/Users/alifiroozi/.gemini/antigravity/brain/0a1b4a6c-d29e-4f6b-af41-0b61032757ff/admin_user_modal_profile.png",
      fullPage: false,
    });
    console.log("Saved admin_user_modal_profile.png");

    // Click "دستگاه و تله‌متری" tab
    const deviceTab = page.locator('button:has-text("دستگاه و تله‌متری")');
    if (await deviceTab.isVisible()) {
      await deviceTab.click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: "/Users/alifiroozi/.gemini/antigravity/brain/0a1b4a6c-d29e-4f6b-af41-0b61032757ff/admin_user_modal_telemetry.png",
        fullPage: false,
      });
      console.log("Saved admin_user_modal_telemetry.png");
    }

    // Click "درخواست‌ها" tab
    const requestsTab = page.locator('button:has-text("درخواست‌ها")');
    if (await requestsTab.isVisible()) {
      await requestsTab.click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: "/Users/alifiroozi/.gemini/antigravity/brain/0a1b4a6c-d29e-4f6b-af41-0b61032757ff/admin_user_modal_requests.png",
        fullPage: false,
      });
      console.log("Saved admin_user_modal_requests.png");
    }
    
    // Close modal
    const closeButton = page.locator('button:has(svg.lucide-x)').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await page.waitForTimeout(500);
    }
  }

  // Switch to Dark mode
  await page.evaluate(() => {
    document.documentElement.classList.add("dark");
  });
  await page.waitForTimeout(800);

  await page.screenshot({
    path: "/Users/alifiroozi/.gemini/antigravity/brain/0a1b4a6c-d29e-4f6b-af41-0b61032757ff/admin_user_management_dark.png",
    fullPage: false,
  });
  console.log("Saved admin_user_management_dark.png");

  await browser.close();
  console.log("Capture completed successfully!");
}

main().catch((err) => {
  console.error("Error running capture script:", err);
  process.exit(1);
});
