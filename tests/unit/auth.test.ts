import { describe, it, expect } from "vitest";
import { hashOtp, generateNumericOtp } from "@/modules/auth/auth.service";

describe("Auth Module & Hashing Unit Tests", () => {
  it("should generate a 6-digit numeric OTP string", () => {
    const otp = generateNumericOtp(6);
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  it("should produce deterministic SHA-256 hash for OTP codes", () => {
    const code = "123456";
    const hash1 = hashOtp(code);
    const hash2 = hashOtp(code);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it("should fail hash comparison for incorrect OTP codes", () => {
    const hash1 = hashOtp("123456");
    const hash2 = hashOtp("654321");

    expect(hash1).not.toBe(hash2);
  });
});
