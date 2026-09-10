type LogLevel = "info" | "warn" | "error" | "debug";

const PII_FIELDS = ["phone", "email", "name", "customer_name"];

function redactPii(obj: Record<string, unknown>): Record<string, unknown> {
  const redacted = { ...obj };
  for (const key of PII_FIELDS) {
    if (redacted[key]) {
      redacted[key] = "[REDACTED]";
    }
  }
  return redacted;
}

export function log(
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>
) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta ? redactPii(meta) : {}),
  };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) =>
    log("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) =>
    log("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) =>
    log("error", msg, meta),
  debug: (msg: string, meta?: Record<string, unknown>) =>
    log("debug", msg, meta),
};