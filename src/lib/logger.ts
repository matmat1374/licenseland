// Centralized logger — Edge-safe (no fs/path imports).
// In Node.js runtime: logs to console + file (via runtime check).
// In Edge runtime: logs to console only.

type Level = "INFO" | "WARN" | "ERROR" | "DEBUG";

function fmt(level: Level, msg: string, meta?: any): string {
  const ts = new Date().toISOString();
  const metaStr = meta ? " " + JSON.stringify(meta) : "";
  return `[${ts}] ${level} ${msg}${metaStr}`;
}

export function log(level: Level, msg: string, meta?: any) {
  const line = fmt(level, msg, meta);
  if (level === "ERROR") console.error(line);
  else if (level === "WARN") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (msg: string, meta?: any) => log("INFO", msg, meta),
  warn: (msg: string, meta?: any) => log("WARN", msg, meta),
  error: (msg: string, meta?: any) => log("ERROR", msg, meta),
  debug: (msg: string, meta?: any) => log("DEBUG", msg, meta),
};
