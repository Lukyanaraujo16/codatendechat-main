import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";

import {
  buildGlobalNotificationsStorageKey,
  clearGlobalNotificationsStorage,
  GLOBAL_NOTIFICATIONS_MAX_STORED,
  loadGlobalNotifications,
  saveGlobalNotifications,
} from "../../utils/globalNotificationsStorage";
import { matchesChatNotification } from "../../utils/matchesChatNotification";
import { matchesTicketNotification } from "../../utils/matchesTicketNotification";
import { logNotificationMetric } from "../../utils/globalNotificationMetrics";

const GlobalNotificationsContext = createContext(null);

function countUnread(items) {
  return items.filter((n) => !n.read).length;
}

function countInternalChatUnread(items) {
  return items.filter((n) => n.type === "internalChat" && !n.read).length;
}

function buildStateFromItems(items) {
  const list = Array.isArray(items) ? items : [];
  return {
    items: list,
    unreadCount: countUnread(list),
    internalChatUnreadCount: countInternalChatUnread(list),
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "HYDRATE":
      return buildStateFromItems(action.payload);
    case "ADD": {
      const incoming = action.payload;
      if (!incoming?.id) return state;

      const exists = state.items.some(
        (n) => n.id === incoming.id || (incoming.dedupeKey && n.dedupeKey === incoming.dedupeKey)
      );
      if (exists) return state;

      const items = [incoming, ...state.items].slice(0, GLOBAL_NOTIFICATIONS_MAX_STORED);
      return buildStateFromItems(items);
    }
    case "MARK_READ": {
      const id = action.payload;
      const items = state.items.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return buildStateFromItems(items);
    }
    case "MARK_READ_BY_CHAT": {
      const items = state.items.map((n) =>
        matchesChatNotification(n, action.payload)
          ? { ...n, read: true }
          : n
      );
      return buildStateFromItems(items);
    }
    case "MARK_READ_BY_TICKET": {
      const items = state.items.map((n) =>
        matchesTicketNotification(n, action.payload)
          ? { ...n, read: true }
          : n
      );
      return buildStateFromItems(items);
    }
    case "MARK_ALL_READ": {
      const items = state.items.map((n) => ({ ...n, read: true }));
      return buildStateFromItems(items);
    }
    case "REMOVE_BY_TICKET": {
      const ticketId = Number(action.payload);
      const items = state.items.filter(
        (n) => n.type !== "whatsapp" || Number(n.ticketId) !== ticketId
      );
      return buildStateFromItems(items);
    }
    case "CLEAR":
      return buildStateFromItems([]);
    default:
      return state;
  }
}

export function GlobalNotificationsStateProvider({
  children,
  userId,
  companyId,
}) {
  const storageKey = useMemo(
    () => buildGlobalNotificationsStorageKey(userId, companyId),
    [userId, companyId]
  );

  const [state, dispatch] = useReducer(
    reducer,
    null,
    () => buildStateFromItems(loadGlobalNotifications(storageKey))
  );

  useEffect(() => {
    if (!storageKey) return;
    saveGlobalNotifications(storageKey, state.items);
  }, [storageKey, state.items]);

  const addNotification = useCallback((notification) => {
    dispatch({ type: "ADD", payload: notification });
    logNotificationMetric("notification_received", {
      type: notification?.type,
      id: notification?.id,
      ticketId: notification?.ticketId,
      chatId: notification?.chatId,
    });
    return notification;
  }, []);

  const markAsRead = useCallback((id) => {
    dispatch({ type: "MARK_READ", payload: id });
    logNotificationMetric("notification_read", { scope: "single", id });
  }, []);

  const markAsReadByChat = useCallback((chatRef) => {
    if (!chatRef?.chatId && !chatRef?.chatUuid) return;
    dispatch({ type: "MARK_READ_BY_CHAT", payload: chatRef });
    logNotificationMetric("notification_read", {
      scope: "chat",
      chatId: chatRef.chatId,
      chatUuid: chatRef.chatUuid,
    });
  }, []);

  const markAsReadByTicket = useCallback((ticketRef) => {
    if (!ticketRef?.ticketId && !ticketRef?.ticketUuid) return;
    dispatch({ type: "MARK_READ_BY_TICKET", payload: ticketRef });
    logNotificationMetric("notification_read", {
      scope: "ticket",
      ticketId: ticketRef.ticketId,
      ticketUuid: ticketRef.ticketUuid,
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    dispatch({ type: "MARK_ALL_READ" });
    logNotificationMetric("notification_read", { scope: "all" });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: "CLEAR" });
    if (storageKey) {
      clearGlobalNotificationsStorage(storageKey);
    }
  }, [storageKey]);

  const removeByTicketId = useCallback((ticketId) => {
    dispatch({ type: "REMOVE_BY_TICKET", payload: ticketId });
  }, []);

  const value = useMemo(
    () => ({
      notifications: state.items,
      unreadCount: state.unreadCount,
      internalChatUnreadCount: state.internalChatUnreadCount,
      addNotification,
      markAsRead,
      markAsReadByChat,
      markAsReadByTicket,
      markAllAsRead,
      clearAll,
      removeByTicketId,
    }),
    [
      state.items,
      state.unreadCount,
      state.internalChatUnreadCount,
      addNotification,
      markAsRead,
      markAsReadByChat,
      markAsReadByTicket,
      markAllAsRead,
      clearAll,
      removeByTicketId,
    ]
  );

  return (
    <GlobalNotificationsContext.Provider value={value}>
      {children}
    </GlobalNotificationsContext.Provider>
  );
}

export function useGlobalNotifications() {
  const ctx = useContext(GlobalNotificationsContext);
  if (!ctx) {
    throw new Error(
      "useGlobalNotifications must be used within GlobalNotificationsStateProvider"
    );
  }
  return ctx;
}

export default GlobalNotificationsContext;
