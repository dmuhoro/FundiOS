import { describe, expect, it } from "vitest";
import { isDueWithinWindow, selectReminderCandidates, type CustomerForReminder, type ServiceForReminder } from "@/lib/reminders/select-due";

const NOW = "2026-03-10T08:00:00.000Z";

function due(daysFromNow: number): string {
  const ts = new Date(NOW).getTime() + daysFromNow * 24 * 60 * 60 * 1000;
  return new Date(ts).toISOString();
}

function service(overrides: Partial<ServiceForReminder>): ServiceForReminder {
  return {
    id: "svc-1",
    customerId: "cust-1",
    make: "Toyota",
    model: "Fielder",
    nextServiceAt: due(3),
    reminderSent: false,
    ...overrides,
  };
}

function customer(overrides: Partial<CustomerForReminder>): CustomerForReminder {
  return {
    id: "cust-1",
    name: "Nyaga",
    waOptIn: true,
    ...overrides,
  };
}

describe("reminders — candidate selection", () => {
  it("includes services due within the window", () => {
    const result = selectReminderCandidates({
      services: [service({})],
      customersById: [customer({})].map((c) => [c.id, c] as const).reduce((map, [k, v]) => map.set(k, v), new Map<string, CustomerForReminder>()),
      now: NOW,
    });
    expect(result).toHaveLength(1);
    expect(result[0].make).toBe("Toyota");
    expect(result[0].message).toContain("Toyota Fielder");
  });

  it("excludes services due beyond the window", () => {
    const result = selectReminderCandidates({
      services: [service({ nextServiceAt: due(100) })],
      customersById: new Map([["cust-1", customer({})]]),
      now: NOW,
    });
    expect(result).toHaveLength(0);
  });

  it("excludes services already sent a reminder", () => {
    const result = selectReminderCandidates({
      services: [service({ reminderSent: true })],
      customersById: new Map([["cust-1", customer({})]]),
      now: NOW,
    });
    expect(result).toHaveLength(0);
  });

  it("excludes customers who opted out of WhatsApp", () => {
    const result = selectReminderCandidates({
      services: [service({})],
      customersById: new Map([["cust-1", customer({ waOptIn: false })]]),
      now: NOW,
    });
    expect(result).toHaveLength(0);
  });

  it("excludes services with no nextServiceAt", () => {
    const result = selectReminderCandidates({
      services: [service({ nextServiceAt: null })],
      customersById: new Map([["cust-1", customer({})]]),
      now: NOW,
    });
    expect(result).toHaveLength(0);
  });
});

describe("isDueWithinWindow", () => {
  it("returns true for a date within the window", () => {
    expect(isDueWithinWindow({ nextServiceAt: due(3), now: NOW })).toBe(true);
  });

  it("returns false for null dates", () => {
    expect(isDueWithinWindow({ nextServiceAt: null, now: NOW })).toBe(false);
  });

  it("returns false for dates beyond the window", () => {
    expect(isDueWithinWindow({ nextServiceAt: due(100), now: NOW })).toBe(false);
  });
});