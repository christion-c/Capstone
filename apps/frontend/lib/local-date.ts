// Formats a Date as the user's local calendar day (YYYY-MM-DD).
// Date.prototype.toISOString() is UTC-based and would report the wrong
// day near midnight for anyone west of UTC - daily check-ins need the
// day the user actually experienced, not the day it is in UTC.
export function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
