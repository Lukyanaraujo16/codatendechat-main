/**
 * Parseia query params no formato JSON array (ex.: "[1,2]") de forma segura.
 * Valores inválidos, vazios ou malformados retornam [].
 */
export function parseArrayQueryParam(
  raw: string | undefined | null
): number[] {
  if (raw == null) {
    return [];
  }
  const trimmed = String(raw).trim();
  if (
    trimmed === "" ||
    trimmed === "undefined" ||
    trimmed === "null" ||
    trimmed === "[]"
  ) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((v) => Number(v))
      .filter((n) => Number.isInteger(n) && n > 0);
  } catch {
    return [];
  }
}
