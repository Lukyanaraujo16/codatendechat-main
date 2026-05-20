export const SUGGESTED_CONTACT_LABEL_COLORS = {
  yellow: "#F9A825",
  green: "#43A047",
  red: "#E53935",
  blue: "#1E88E5",
  purple: "#8E24AA",
  orange: "#FB8C00",
  pink: "#D81B60",
  cyan: "#00ACC1",
  gray: "#757575",
};

export const CONTACT_LABEL_COLOR_KEYS = Object.keys(SUGGESTED_CONTACT_LABEL_COLORS);

export const DEFAULT_CONTACT_LABEL_COLOR = SUGGESTED_CONTACT_LABEL_COLORS.blue;

const STORAGE_KEY = "contactLabelLastColor";

export function getLastUsedContactLabelColor() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && Object.values(SUGGESTED_CONTACT_LABEL_COLORS).includes(v)) {
      return v;
    }
  } catch (_) {
    /* ignore */
  }
  return DEFAULT_CONTACT_LABEL_COLOR;
}

export function setLastUsedContactLabelColor(color) {
  try {
    if (color) localStorage.setItem(STORAGE_KEY, color);
  } catch (_) {
    /* ignore */
  }
}
