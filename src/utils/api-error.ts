/**
 * Readable message from a rejected API call. The thunks reject with the raw response text,
 * which is often a JSON body ({ message, validationErrors } / ASP.NET { title, errors });
 * show the reason inside it rather than the JSON.
 */
export const apiErrorMessage = (err: any, fallback = "Request failed"): string => {
  const raw = typeof err === "string" ? err : err?.message ?? ""
  if (!raw) return fallback
  try {
    const body = JSON.parse(raw)
    if (typeof body === "string") return body
    const parts: string[] = []
    if (body?.message) parts.push(String(body.message))
    if (Array.isArray(body?.validationErrors)) parts.push(...body.validationErrors.map(String))
    if (body?.errors && typeof body.errors === "object") {
      Object.values(body.errors).forEach((v: any) => parts.push(...(Array.isArray(v) ? v.map(String) : [String(v)])))
    }
    if (!parts.length && body?.title) parts.push(String(body.title))
    const unique = Array.from(new Set(parts.filter(Boolean)))
    return unique.length ? unique.join(" — ") : fallback
  } catch {
    return raw
  }
}
