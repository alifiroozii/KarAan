import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Prompt 38 HTTP security architecture guards", () => {
  it("runs origin protection through the shared authenticated API boundary", () => {
    const middleware = source("src/modules/auth/auth.middleware.ts");
    expect(middleware).toContain("assertSafeMutationOrigin(req)");
    expect(middleware).toContain("export async function requireAuth");
  });

  it("keeps bearer clients while protecting ambient session cookies", () => {
    const security = source("src/modules/auth/request-security.ts");
    expect(security).toContain('authHeader?.startsWith("Bearer ")');
    expect(security).toContain('req.cookies.get("karaan_session")');
    expect(security).toContain('req.headers.get("sec-fetch-site") === "cross-site"');
    expect(security).toContain("x-forwarded-host");
  });

  it("adds a safe global security header baseline", () => {
    const config = source("next.config.ts");
    expect(config).toContain('key: "X-Content-Type-Options", value: "nosniff"');
    expect(config).toContain('key: "X-Frame-Options", value: "DENY"');
    expect(config).toContain('key: "Strict-Transport-Security"');
    expect(config).toContain("frame-ancestors 'none'");
  });

  it("forces all API responses to private no-store", () => {
    const config = source("next.config.ts");
    expect(config).toContain('source: "/api/:path*"');
    expect(config).toContain('value: "private, no-store, max-age=0"');
  });

  it("prevents private application shells from search indexing", () => {
    const config = source("next.config.ts");
    expect(config).toContain('source: "/admin/:path*"');
    expect(config).toContain('source: "/worker/:path*"');
    expect(config).toContain('source: "/employer/:path*"');
    expect(config).toContain('value: "noindex, nofollow, noarchive"');
  });
});
