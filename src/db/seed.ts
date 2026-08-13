import { db } from "./index";
import { users, workerProfiles, employerProfiles, shifts } from "./schema";
import crypto from "crypto";

export async function seedDatabase() {
  console.log("[Seed] Starting database seed process...");

  try {
    const workerUserId = `usr_${crypto.randomUUID()}`;
    const employerUserId = `usr_${crypto.randomUUID()}`;

    // Seed Worker
    await db.insert(users).values({
      id: workerUserId,
      phone: "09123456789",
      role: "WORKER",
      fullName: "علی رضایی (کارجو)",
    }).onConflictDoNothing();

    await db.insert(workerProfiles).values({
      id: `wp_${crypto.randomUUID()}`,
      userId: workerUserId,
      bio: "نیروی انبارداری و بسته‌بندی مسلط به سیستم‌های فروشگاهی",
      skills: ["انبارداری", "بسته‌بندی"],
      hourlyRateRials: BigInt(1500000),
      reliabilityScore: "98.50",
    }).onConflictDoNothing();

    // Seed Employer
    await db.insert(users).values({
      id: employerUserId,
      phone: "09987654321",
      role: "EMPLOYER",
      fullName: "فروشگاه‌های زنجیره‌ای آریا",
    }).onConflictDoNothing();

    await db.insert(employerProfiles).values({
      id: `ep_${crypto.randomUUID()}`,
      userId: employerUserId,
      companyName: "فروشگاه‌های زنجیره‌ای آریا",
      walletBalanceRials: BigInt(250000000),
    }).onConflictDoNothing();

    // Seed Initial Shift
    await db.insert(shifts).values({
      id: `shf_${crypto.randomUUID()}`,
      employerId: employerUserId,
      title: "انباردار و دسته‌بندی کالا",
      description: "نیاز به ۱ نفر نیروی مسلط به انبارداری و بسته‌بندی کالا",
      locationName: "تهران، میدان انقلاب، خیابان کارگر شمالی",
      latitude: 35.7000,
      longitude: 51.3500,
      geofenceRadiusMeters: 100,
      requiredSkills: ["انبارداری", "بسته‌بندی"],
      hourlyPayRials: BigInt(1500000),
      totalBudgetRials: BigInt(6000000),
      startTime: new Date(Date.now() + 3600000),
      endTime: new Date(Date.now() + 3600000 * 5),
      status: "PUBLISHED",
    }).onConflictDoNothing();

    console.log("[Seed] Database seed completed successfully.");
  } catch (err) {
    console.error("[Seed Error]", err);
  }
}

if (require.main === module) {
  seedDatabase().then(() => process.exit(0));
}
