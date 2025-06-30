/**
 * Calculate the number of days between a given date and now
 * @param date The date to compare against
 * @returns Number of days since the given date
 */
export function timeSince(date: Date): number {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  return diffInDays;
}

/**
 * Format the time since a date in a human-readable way
 * @param date The date to compare against
 * @returns Formatted string like "3 days ago", "1 week ago", etc.
 */
export function formatTimeSince(date: Date): string {
  const days = timeSince(date);

  if (days === 0) {
    return "today";
  } else if (days === 1) {
    return "1 day ago";
  } else if (days < 7) {
    return `${days} days ago`;
  } else if (days < 14) {
    return "1 week ago";
  } else if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} weeks ago`;
  } else if (days < 60) {
    return "1 month ago";
  } else {
    const months = Math.floor(days / 30);
    return `${months} months ago`;
  }
}
