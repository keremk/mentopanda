const logLevels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;

function getCurrentLevel(): LogLevel {
  const env = process.env.NEXT_PUBLIC_LOG_LEVEL?.toLowerCase();
  if (env && env in logLevels) return env as LogLevel;
  return "info";
}

const currentLevel = getCurrentLevel();

export const logger = {
  debug(msg: string, data?: unknown): void {
    if (logLevels.debug >= logLevels[currentLevel])
      console.debug(`[DEBUG] ${msg}`, data ?? "");
  },
  info(msg: string, data?: unknown): void {
    if (logLevels.info >= logLevels[currentLevel])
      console.info(`[INFO] ${msg}`, data ?? "");
  },
  warn(msg: string, data?: unknown): void {
    if (logLevels.warn >= logLevels[currentLevel])
      console.warn(`[WARN] ${msg}`, data ?? "");
  },
  error(msg: string, data?: unknown): void {
    if (logLevels.error >= logLevels[currentLevel])
      console.error(`[ERROR] ${msg}`, data ?? "");
  },
};

// --- types ---
type LogLevel = keyof typeof logLevels;
