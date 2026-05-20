/** Retorna #fff ou #1a1a1a conforme luminância do fundo. */
export function getLabelChipTextColor(hexColor) {
  if (!hexColor || typeof hexColor !== "string") return "#fff";
  const hex = hexColor.replace("#", "");
  if (hex.length !== 6) return "#fff";
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#1a1a1a" : "#ffffff";
}
