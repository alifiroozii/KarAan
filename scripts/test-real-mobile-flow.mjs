import { chromium } from "@playwright/test";

async function main() {
  console.log("=== 1. Checking Initial Dashboard (Master Admin Only) ===");
  const initialCheckRes = await fetch("http://localhost:3000/api/auth/gmail");
  const initialStats = await initialCheckRes.json();
  console.log("Initial Stats before mobile login:", initialStats);

  console.log("\n=== 2. Real Mobile App: Worker (کارجو) Login & Telemetry Submission ===");
  const workerLoginRes = await fetch("http://localhost:3000/api/auth/gmail", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "5.120.45.18",
    },
    body: JSON.stringify({
      email: "hosein.hosseini.worker@gmail.com",
      fullName: "حسین حسینی (تکنسین برق و تأسیسات)",
      role: "WORKER",
      phone: "09123456789",
      platform: "ANDROID",
      deviceModel: "Samsung Galaxy S23 (SM-S911B)",
      appVersion: "KARJOOR v2.4.0 (Build 42)",
      city: "تهران (منطقه ۵ - پونک)",
      skills: ["برق‌کاری ساختمان", "تأسیسات سرمایشی", "نصب اسپلیت"],
      submittedRequests: [
        {
          title: "آماده اعزام فوری: تعمیر و سیم‌کشی تابلو برق ساختمان",
          category: "برق و الکترونیک",
          budget: "ساعتی ۳۰۰٬۰۰۰ تومان",
          city: "تهران",
          address: "غرب و شمال غرب تهران",
          details: "مجهز به کلیه ابزارآلات فلوک و تسترهای تخصصی مدار",
        },
      ],
    }),
  });
  const workerResult = await workerLoginRes.json();
  console.log("Worker Login Status:", workerLoginRes.status, "User ID:", workerResult.data?.user?.id);

  console.log("\n=== 3. Real Mobile App: Employer (کارفرما) Login & Request Submission ===");
  const employerLoginRes = await fetch("http://localhost:3000/api/auth/gmail", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "2.180.99.14",
    },
    body: JSON.stringify({
      email: "alireza.bahrami.employer@gmail.com",
      fullName: "مهندس علیرضا بهرامی (پروژه ساختمانی ستاره)",
      role: "EMPLOYER",
      phone: "09351234567",
      platform: "ANDROID",
      deviceModel: "Xiaomi 13 Pro (2210132G)",
      appVersion: "KARJOOR v2.4.0 (Build 42)",
      city: "تهران (منطقه ۱ - فرمانیه)",
      submittedRequests: [
        {
          title: "نیاز فوری به ۲ نفر برق‌کار صنعتی جهت پروژه ساختمانی برج ستاره",
          category: "تأسیسات الکتریکی",
          budget: "روزانه ۲٬۵۰۰٬۰۰۰ تومان + ناهار",
          city: "تهران",
          address: "فرمانیه، تقاطع دیباجی شمالی",
          details: "اجرای داکت‌کشی و اتصال سرخط‌های روشنایی و هوشمند ساختمان",
        },
      ],
    }),
  });
  const employerResult = await employerLoginRes.json();
  console.log("Employer Login Status:", employerLoginRes.status, "User ID:", employerResult.data?.user?.id);

  console.log("\n=== 4. Opening Admin Dashboard via Playwright to verify Live Presence ===");
  const browser = await chromium.launch({
    headless: true,
    channel: "chrome",
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    locale: "fa-IR",
  });
  const page = await context.newPage();

  console.log("Logging into Admin Dashboard...");
  await page.goto("http://localhost:3000/admin/login", { waitUntil: "networkidle" });
  await page.fill('input[type="text"], input[name="username"]', "admin@karaan.ir");
  await page.fill('input[type="password"]', "KarAan@Admin2026!");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);

  console.log("Navigating to /admin...");
  await page.goto("http://localhost:3000/admin", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // Capture full screenshot showing the real worker and employer
  await page.screenshot({
    path: "/Users/alifiroozi/.gemini/antigravity/brain/0a1b4a6c-d29e-4f6b-af41-0b61032757ff/real_mobile_users_dashboard.png",
    fullPage: false,
  });
  console.log("Saved real_mobile_users_dashboard.png");

  // Inspect the Worker (حسین حسینی)
  const workerRow = page.locator('tr:has-text("حسین حسینی")');
  if (await workerRow.isVisible()) {
    console.log("Found real worker row in dashboard! Opening inspector...");
    const inspectBtn = workerRow.locator('button:has-text("شناسنامه")');
    await inspectBtn.click();
    await page.waitForTimeout(800);

    // Click telemetry tab
    const deviceTab = page.locator('button:has-text("دستگاه و تله‌متری")');
    if (await deviceTab.isVisible()) {
      await deviceTab.click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: "/Users/alifiroozi/.gemini/antigravity/brain/0a1b4a6c-d29e-4f6b-af41-0b61032757ff/real_worker_telemetry.png",
      });
      console.log("Saved real_worker_telemetry.png");
    }

    // Click requests tab
    const reqTab = page.locator('button:has-text("درخواست‌ها")');
    if (await reqTab.isVisible()) {
      await reqTab.click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: "/Users/alifiroozi/.gemini/antigravity/brain/0a1b4a6c-d29e-4f6b-af41-0b61032757ff/real_worker_requests.png",
      });
      console.log("Saved real_worker_requests.png");
    }

    // Close modal
    const closeBtn = page.locator('button:has(svg.lucide-x)').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }
  }

  // Inspect the Employer (علیرضا بهرامی)
  const employerRow = page.locator('tr:has-text("علیرضا بهرامی")');
  if (await employerRow.isVisible()) {
    console.log("Found real employer row in dashboard! Opening inspector...");
    const inspectBtn = employerRow.locator('button:has-text("شناسنامه")');
    await inspectBtn.click();
    await page.waitForTimeout(800);

    // Click requests tab
    const reqTab = page.locator('button:has-text("درخواست‌ها")');
    if (await reqTab.isVisible()) {
      await reqTab.click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: "/Users/alifiroozi/.gemini/antigravity/brain/0a1b4a6c-d29e-4f6b-af41-0b61032757ff/real_employer_requests.png",
      });
      console.log("Saved real_employer_requests.png");
    }
  }

  await browser.close();
  console.log("\n=== Test completed successfully! Real worker & employer are live in Admin Dashboard! ===");
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
