import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "./index";

export async function runMigrations() {
  console.log("[Migrator] Running database migrations...");
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("[Migrator] Migrations applied successfully.");
  } catch (err) {
    console.error("[Migrator Error]", err);
  }
}

if (require.main === module) {
  runMigrations().then(() => process.exit(0));
}
