/** Normalize API / axios / unknown errors to a user-facing string */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object") {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
    const detail = (err as { detail?: unknown }).detail;
    if (typeof detail === "string" && detail.trim()) return detail;
  }
  if (typeof err === "string" && err.trim()) return err;
  return fallback;
}
