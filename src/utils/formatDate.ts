export function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(navigator.language, {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
}