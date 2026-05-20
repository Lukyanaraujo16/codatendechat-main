export const STORAGE_OPEN_CONVERSATION = "notificationSoundOpenConversation";
const STORAGE_BACKGROUND_ONLY_LEGACY = "notificationSoundBackgroundOnly";

export function migrateOpenConversationPreference() {
  const existing = localStorage.getItem(STORAGE_OPEN_CONVERSATION);
  if (existing !== null) {
    return existing === "true";
  }

  const legacy = localStorage.getItem(STORAGE_BACKGROUND_ONLY_LEGACY);
  if (legacy !== null) {
    const enabled = legacy !== "true";
    localStorage.setItem(STORAGE_OPEN_CONVERSATION, enabled ? "true" : "false");
    localStorage.removeItem(STORAGE_BACKGROUND_ONLY_LEGACY);
    return enabled;
  }

  localStorage.setItem(STORAGE_OPEN_CONVERSATION, "true");
  return true;
}

export function readOpenConversationEnabled() {
  return migrateOpenConversationPreference();
}

export function persistOpenConversationEnabled(enabled) {
  localStorage.setItem(
    STORAGE_OPEN_CONVERSATION,
    enabled ? "true" : "false"
  );
}
