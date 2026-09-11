import { describe, expect, it } from "vitest";
import { summarizeServices, type ServiceRecord } from "@/lib/crm/services";

function service(overrides: Partial<ServiceRecord>): ServiceRecord {
  return {
    id: "svc-1",
    status: "completed",
    amountKsh: 100,
    paid: true,
    ...overrides,
  };
}

describe("services — deterministic summaries", () => {
  it("sums amounts with minor-unit precision", () => {
    const summary = summarizeServices([
      service({ id: "s1", amountKsh: 0.1, paid: true }),
      service({ id: "s2", amountKsh: 0.2, paid: true }),
      service({ id: "s3", amountKsh: 5000, paid: false }),
    ]);

    expect(summary.count).toBe(3);
    expect(summary.totalMinorUnits).toBe(500030);
    expect(summary.totalKsh).toBe(5000.3);
    expect(summary.paidKsh).toBe(0.3);
    expect(summary.paidCount).toBe(2);
  });

  it("counts statuses and ignores null amounts", () => {
    const summary = summarizeServices([
      service({ id: "s1", status: "completed", amountKsh: null, paid: true }),
      service({ id: "s2", status: "pending", amountKsh: null, paid: false }),
      service({ id: "s3", status: "in_progress", amountKsh: 1500, paid: false }),
    ]);

    expect(summary.statusCounts).toEqual({
      completed: 1,
      pending: 1,
      in_progress: 1,
    });
    expect(summary.totalMinorUnits).toBe(150000);
  });

  it("returns an empty summary for no services", () => {
    const summary = summarizeServices([]);
    expect(summary).toEqual({
      count: 0,
      totalMinorUnits: 0,
      paidMinorUnits: 0,
      paidCount: 0,
      totalKsh: 0,
      paidKsh: 0,
      statusCounts: {},
    });
  });
});