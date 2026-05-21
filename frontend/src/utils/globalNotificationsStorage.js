const STORAGE_PREFIX = "atendechat:globalNotifications";
const MAX_STORED = 50;

export function buildGlobalNotificationsStorageKey(userId, companyId) {
  if (userId == null || userId === "" || companyId == null || companyId === "") {
    return null;
  }
  return `${STORAGE_PREFIX}:${companyId}:${userId}`;
}

function sanitizeNotification(item) {
  if (!item || typeof item !== "object") return null;
  if (!item.id || !item.type) return null;
  return {
    id: String(item.id),
    dedupeKey: item.dedupeKey ? String(item.dedupeKey) : undefined,
    type: item.type,
    title: String(item.title || ""),
    body: String(item.body || ""),
    createdAt: Number(item.createdAt) || Date.now(),
    read: Boolean(item.read),
    targetUrl: item.targetUrl ? String(item.targetUrl) : "",
    ticketId: item.ticketId ?? null,
    ticketUuid: item.ticketUuid ?? null,
    chatId: item.chatId ?? null,
    chatUuid: item.chatUuid ?? null,
    senderName: item.senderName ? String(item.senderName) : "",
    companyId: item.companyId ?? null,
    messageId: item.messageId ?? null,
  };
}

export function loadGlobalNotifications(storageKey) {
  if (!storageKey || typeof sessionStorage === "undefined") {
    return [];
  }
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(sanitizeNotification)
      .filter(Boolean)
      .slice(0, MAX_STORED);
  } catch {
    return [];
  }
}

export function saveGlobalNotifications(storageKey, items) {
  if (!storageKey || typeof sessionStorage === "undefined") {
    return;
  }
  try {
    const payload = (Array.isArray(items) ? items : [])
      .map(sanitizeNotification)
      .filter(Boolean)
      .slice(0, MAX_STORED);
    sessionStorage.setItem(storageKey, JSON.stringify(payload));
  } catch {
    // quota ou modo privado
  }
}

export function clearGlobalNotificationsStorage(storageKey) {
  if (!storageKey || typeof sessionStorage === "undefined") {
    return;
  }
  try {
    sessionStorage.removeItem(storageKey);
  } catch {
    // ignore
  }
}

export { MAX_STORED as GLOBAL_NOTIFICATIONS_MAX_STORED };
