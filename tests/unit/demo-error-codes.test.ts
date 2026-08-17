import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "src/lib/errors.ts"), "utf8");

describe("demo auth error codes", () => {
  it("keeps demo-specific errors inside the canonical ErrorCode union", () => {
    expect(source).toContain('"DEMO_ACCESS_DISABLED"');
    expect(source).toContain('"INVALID_DEMO_ROLE"');
    expect(source).toContain('"DEMO_ACCOUNT_ROLE_CONFLICT"');
  });
});
