import { describe, expect, it } from "vitest";
import { isValidKenyanPhone, normalizePhone, samePhone } from "@/lib/phone";

describe("phone — normalization", () => {
  it("normalizes local formats to +254", () => {
    expect(normalizePhone("0712345678")).toBe("+254712345678");
    expect(normalizePhone("712345678")).toBe("+254712345678");
    expect(normalizePhone("254712345678")).toBe("+254712345678");
    expect(normalizePhone("+254712345678")).toBe("+254712345678");
    expect(normalizePhone("00254712345678")).toBe("+254712345678");
  });

  it("strips separators and whitespace", () => {
    expect(normalizePhone("+254 712 345 678")).toBe("+254712345678");
    expect(normalizePhone("+254.712.345.678")).toBe("+254712345678");
  });

  it("compares phones semantically", () => {
    expect(samePhone("0712345678", "+254712345678")).toBe(true);
    expect(samePhone("0712345678", "0712987654")).toBe(false);
  });

  it("validates Kenyan mobile numbers", () => {
    expect(isValidKenyanPhone("0712345678")).toBe(true);
    expect(isValidKenyanPhone("+254112345678")).toBe(true);
    expect(isValidKenyanPhone("0212345678")).toBe(false);
  });
});