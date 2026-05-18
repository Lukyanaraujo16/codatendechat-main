/**
 * Decodifica entidades HTML comuns (ex.: &#x2F; → /) vindas de interpolação i18n antiga.
 */
export function decodeHtmlEntities(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/&#x2F;/gi, "/")
    .replace(/&#47;/g, "/")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Formata storageCalculatedAt / calculatedAt (ISO ou Date) para exibição pt-BR.
 */
export function formatStorageCalculatedAt(value) {
  if (value == null || value === "") return null;

  let date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime()) && typeof value === "string") {
    const decoded = decodeHtmlEntities(value);
    date = new Date(decoded);
    if (Number.isNaN(date.getTime())) {
      return decoded;
    }
  }
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}
