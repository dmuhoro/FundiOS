export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");

  if (digits.startsWith("00")) {
    return `+${digits.slice(2)}`;
  }
  if (digits.startsWith("254")) {
    return `+${digits}`;
  }
  if (digits.startsWith("7") || digits.startsWith("1")) {
    return `+254${digits}`;
  }
  if (digits.startsWith("0")) {
    return `+254${digits.slice(1)}`;
  }
  return `+${digits}`;
}

export function samePhone(a: string, b: string): boolean {
  return normalizePhone(a) === normalizePhone(b);
}

export function isValidKenyanPhone(input: string): boolean {
  const normalized = normalizePhone(input);
  return /^\+254(7|1)[0-9]{8}$/.test(normalized);
}
