import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import calendar from "dayjs/plugin/calendar";

dayjs.extend(relativeTime);
dayjs.extend(calendar);
export function formatEntryDate(iso: string): string {
  const d = dayjs(iso);
  const now = dayjs();

  if (d.isSame(now, "day")) {
    return d.format("HH:mm");
  }
  if (d.isSame(now, "year")) {
    return d.format("MMM D");
  }
  return d.format("MMM D, YYYY");
}

export function formatRelative(iso: string): string {
  return dayjs(iso).fromNow();
}
