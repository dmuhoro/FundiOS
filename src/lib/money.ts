import { KES_FORMATTER } from "@/lib/constants";

export function toMinorUnits(amount: number): number {
  if (!Number.isFinite(amount)) {
    throw new Error("Amount must be finite");
  }
  return Math.round(Number(amount.toFixed(2)) * 100);
}

export function fromMinorUnits(minorUnits: number): number {
  return minorUnits / 100;
}

export function sumMinorUnits(amounts: number[]): number {
  return amounts.reduce((acc, minorUnits) => acc + minorUnits, 0);
}

export function formatKES(minorUnits: number): string {
  return KES_FORMATTER.format(fromMinorUnits(minorUnits));
}