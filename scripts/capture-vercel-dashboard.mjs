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

  console.log("Navigating to https://kar-aan.vercel.app/admin/login...");
  await page.goto("https://kar-aan.vercel.app/admin/login", { waitUntil: "networkidle" });

  await page.screenshot({
    path: "/Users/alifiroozi/.gemini/antigravity/brain/0a1b4a6c-d29e-4f6b-af41-0b61032757ff/vercel_live_login.png",
    fullPage: false,
  });
  console.log("Saved vercel_live_login.png");

  // Fill credentials on live Vercel
  await page.fill('input[type="text"], input[name="username"]', "admin@karaan.ir");
  await page.fill('input[type="password"]', "KarAan@Admin2026!");
  
  // Submit login
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // Navigate to live Vercel /admin
  console.log("Navigating to https://kar-aan.vercel.app/admin...");
  await page.goto("https://kar-aan.vercel.app/admin", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  await page.screenshot({
    path: "/Users/alifiroozi/.gemini/antigravity/brain/0a1b4a6c-d29e-4f6b-af41-0b61032757ff/vercel_live_dashboard.png",
    fullPage: false,
  });
  console.log("Saved vercel_live_dashboard.png");

  await browser.close();
  console.log("Vercel capture completed successfully!");
}

main().catch((err) => {
  console.error("Error capturing Vercel dashboard:", err);
  process.exit(1);
});
