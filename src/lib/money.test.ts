import { describe, expect, it } from "vitest";
import { formatKES, fromMinorUnits, sumMinorUnits, toMinorUnits } from "@/lib/money";

describe("money — deterministic aggregation", () => {
  it("aggregates 0.1 + 0.2 without float drift", () => {
    const totalMinor = sumMinorUnits([toMinorUnits(0.1), toMinorUnits(0.2)]);
    expect(totalMinor).toBe(30);
    expect(fromMinorUnits(totalMinor)).toBe(0.3);
  });

  it("rounds to 2 decimal places in minor units", () => {
    expect(toMinorUnits(12.345)).toBe(1235);
    expect(toMinorUnits(12.344)).toBe(1234);
  });

  it("formats KES using the locale formatter", () => {
    expect(formatKES(125000)).toMatch(/Ksh\s+1,250/);
  });

  it("rejects non-finite amounts", () => {
    expect(() => toMinorUnits(Number.NaN)).toThrow();
    expect(() => toMinorUnits(Number.POSITIVE_INFINITY)).toThrow();
  });
});