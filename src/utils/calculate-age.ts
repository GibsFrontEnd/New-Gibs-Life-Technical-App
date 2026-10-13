export function calculateAgeFrom(input: Date | string | null | undefined): number {
  if (!input) return 0;

  let d: Date;
  if (input instanceof Date) {
    d = input;
  } else if (typeof input === "string") {
    // try ISO first
    d = new Date(input);
    if (isNaN(d.getTime())) {
      // try common fallback: replace space-month formats like "dd MMM, yyyy" -> "dd MMM yyyy"
      const cleaned = input.replace(",", "");
      d = new Date(cleaned);
    }
  } else {
    return 0;
  }

  if (isNaN(d.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
    age--;
  }

  return Math.max(0, age);
}