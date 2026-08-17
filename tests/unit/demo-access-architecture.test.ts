import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("temporary demo access architecture guards", () => {
  it("keeps demo login limited to Worker and Employer", () => {
    const route = source("src/app/api/auth/demo/route.ts");
    const service = source("src/modules/auth/demo-auth.service.ts");

    expect(route).toContain('value === "WORKER" || value === "EMPLOYER"');
    expect(route).toContain('process.env.DEMO_OPEN_ACCESS === "false"');
    expect(service).toContain('export type DemoRole = "WORKER" | "EMPLOYER"');
    expect(service).not.toContain('"ADMIN"');
    expect(service).not.toContain('"SUPER_ADMIN"');
  });

  it("issues a real HttpOnly session instead of disabling middleware auth", () => {
    const route = source("src/app/api/auth/demo/route.ts");
    const middleware = source("src/middleware.ts");

    expect(route).toContain('response.cookies.set("karaan_session"');
    expect(route).toContain("httpOnly: true");
    expect(middleware).toContain('pathname.startsWith("/admin")');
    expect(middleware).toContain('req.cookies.get("karaan_session")');
  });

  it("provisions review-safe Worker and Employer domain foundations", () => {
    const service = source("src/modules/auth/demo-auth.service.ts");

    expect(service).toContain("pg_advisory_xact_lock");
    expect(service).toContain('verificationStatus: "VERIFIED"');
    expect(service).toContain("businesses");
    expect(service).toContain("businessMembers");
    expect(service).toContain("branches");
  });

  it("explains the current release and exposes both demo entry points on landing", () => {
    const landing = source("src/app/page.tsx");

    expect(landing).toContain("آخرین نسخه کارآن روی Main");
    expect(landing).toContain("Prompt 24 تا 33");
    expect(landing).toContain("مشاهده پنل کارگر — بدون OTP");
    expect(landing).toContain("مشاهده پنل کارفرما — بدون OTP");
    expect(landing).toContain("سیستم Auth و OTP اصلی حذف نشده");
  });
});
