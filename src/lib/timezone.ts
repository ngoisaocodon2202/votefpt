export const MAX_DAILY_VOTES = 3;

export const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Ho_Chi_Minh";

/**
 * Returns YYYY-MM-DD formatted calendar date in the configured local timezone.
 * Resets strictly at 00:00:00 local time.
 */
export function getLocalDateString(
  date: Date = new Date(),
  timeZone: string = APP_TIMEZONE
): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

/**
 * Returns exact ISO timestamp and ms remaining until the next 00:00:00 local reset.
 */
export function getNextLocalMidnight(
  date: Date = new Date(),
  timeZone: string = APP_TIMEZONE
): { nextResetAt: string; msUntilReset: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const getPart = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value || "0", 10);

  const hour = getPart("hour") % 24;
  const minute = getPart("minute");
  const second = getPart("second");
  const ms = date.getMilliseconds();

  const elapsedMsToday = (hour * 3600 + minute * 60 + second) * 1000 + ms;
  const totalDayMs = 24 * 60 * 60 * 1000;
  const msUntilReset = Math.max(1000, totalDayMs - elapsedMsToday);
  const nextResetDate = new Date(date.getTime() + msUntilReset);

  return {
    nextResetAt: nextResetDate.toISOString(),
    msUntilReset,
  };
}
