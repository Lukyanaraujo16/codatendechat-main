export const NOTIFICATION_CENTER_TABS = {
  ALL: "all",
  WHATSAPP: "whatsapp",
  INTERNAL: "internalChat",
  UNREAD: "unread",
};

const TAB_STORAGE_KEY = "notificationCenterActiveTab";
const INITIAL_VISIBLE = 20;
const PAGE_STEP = 20;
export const NOTIFICATION_CENTER_MAX_VISIBLE = 50;

export function loadNotificationCenterTab() {
  try {
    const v = sessionStorage.getItem(TAB_STORAGE_KEY);
    if (Object.values(NOTIFICATION_CENTER_TABS).includes(v)) {
      return v;
    }
  } catch {
    // ignore
  }
  return NOTIFICATION_CENTER_TABS.ALL;
}

export function saveNotificationCenterTab(tab) {
  try {
    sessionStorage.setItem(TAB_STORAGE_KEY, tab);
  } catch {
    // ignore
  }
}

export function filterNotificationsByTab(notifications, tab) {
  const list = Array.isArray(notifications) ? notifications : [];
  switch (tab) {
    case NOTIFICATION_CENTER_TABS.WHATSAPP:
      return list.filter((n) => n.type === "whatsapp");
    case NOTIFICATION_CENTER_TABS.INTERNAL:
      return list.filter((n) => n.type === "internalChat");
    case NOTIFICATION_CENTER_TABS.UNREAD:
      return list.filter((n) => !n.read);
    default:
      return list;
  }
}

export function groupNotificationsForCenter(filtered, tab) {
  if (tab !== NOTIFICATION_CENTER_TABS.ALL) {
    return filtered.length
      ? [{ sectionKey: null, items: filtered }]
      : [];
  }

  const internal = filtered.filter((n) => n.type === "internalChat");
  const whatsapp = filtered.filter((n) => n.type === "whatsapp");
  const groups = [];

  if (internal.length) {
    groups.push({ sectionKey: "internalChat", items: internal });
  }
  if (whatsapp.length) {
    groups.push({ sectionKey: "whatsapp", items: whatsapp });
  }

  return groups;
}

export function countSectionUnread(items) {
  return items.filter((n) => !n.read).length;
}

export function formatNotificationDisplayLine(notification) {
  if (!notification) return "";

  const sender = String(notification.senderName || "").trim();
  const body = String(notification.body || "").trim();
  const colon = body.indexOf(": ");

  if (sender && colon > 0) {
    const preview = body.slice(colon + 2).trim();
    return `${sender} → "${preview}"`;
  }

  if (colon > 0) {
    const name = body.slice(0, colon).trim();
    const preview = body.slice(colon + 2).trim();
    return `${name} → "${preview}"`;
  }

  return body;
}

/** Linhas planas para lista virtualizada: section | item */
export function buildVirtualRows(groups, visibleLimit) {
  const rows = [];
  let count = 0;
  const totalItems = countTotalItems(groups);

  for (const group of groups) {
    const remaining = visibleLimit - count;
    if (remaining <= 0) {
      break;
    }

    const slice = group.items.slice(0, remaining);
    if (!slice.length) {
      continue;
    }

    if (group.sectionKey) {
      rows.push({
        rowType: "section",
        key: `section-${group.sectionKey}`,
        sectionKey: group.sectionKey,
        unread: countSectionUnread(group.items),
      });
    }

    for (const notification of slice) {
      rows.push({
        rowType: "item",
        key: notification.id,
        notification,
      });
      count += 1;
    }
  }

  return {
    rows,
    hasMore: count < totalItems,
    totalItems,
  };
}

function countTotalItems(groups) {
  return groups.reduce((acc, g) => acc + g.items.length, 0);
}

export function getNextVisibleLimit(current, total) {
  const next = current + PAGE_STEP;
  return Math.min(next, total, NOTIFICATION_CENTER_MAX_VISIBLE);
}

export { INITIAL_VISIBLE as NOTIFICATION_CENTER_INITIAL_VISIBLE };
