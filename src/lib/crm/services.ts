import type { ServiceStatus } from "@/types";
import { fromMinorUnits, toMinorUnits } from "@/lib/money";

export interface ServiceRecord {
  id: string;
  status: ServiceStatus;
  amountKsh: number | null;
  paid: boolean;
  reminderSent?: boolean;
  nextServiceAt?: string | null;
}

export interface ServiceSummary {
  count: number;
  totalMinorUnits: number;
  paidMinorUnits: number;
  paidCount: number;
  totalKsh: number;
  paidKsh: number;
  statusCounts: Partial<Record<ServiceStatus, number>>;
}

export function summarizeServices(rows: ServiceRecord[]): ServiceSummary {
  const minor = (amount: number | null): number => (amount === null ? 0 : toMinorUnits(amount));

  const amounts = rows.map((row) => minor(row.amountKsh));
  const paidRows = rows.filter((row) => row.paid);
  const paidMinor = paidRows.map((row) => minor(row.amountKsh));

  const totalMinorUnits = amounts.reduce((acc, value) => acc + value, 0);
  const paidMinorUnits = paidMinor.reduce((acc, value) => acc + value, 0);

  const statusCounts: Partial<Record<ServiceStatus, number>> = {};
  for (const row of rows) {
    statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1;
  }

  return {
    count: rows.length,
    totalMinorUnits,
    paidMinorUnits,
    paidCount: paidRows.length,
    totalKsh: fromMinorUnits(totalMinorUnits),
    paidKsh: fromMinorUnits(paidMinorUnits),
    statusCounts,
  };
}