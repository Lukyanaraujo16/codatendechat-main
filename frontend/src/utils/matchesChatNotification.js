/** Marca notificações de chat interno que correspondem ao chat aberto. */
export function matchesChatNotification(notification, { chatId, chatUuid } = {}) {
  if (!notification || notification.type !== "internalChat") {
    return false;
  }

  const idNum =
    chatId != null && chatId !== "" && !Number.isNaN(Number(chatId))
      ? Number(chatId)
      : null;
  const uuid =
    chatUuid != null && chatUuid !== "" ? String(chatUuid) : null;

  if (idNum != null && Number(notification.chatId) === idNum) {
    return true;
  }
  if (uuid && notification.chatUuid && String(notification.chatUuid) === uuid) {
    return true;
  }
  if (uuid && String(notification.chatId) === uuid) {
    return true;
  }

  const segment = uuid || (idNum != null ? String(idNum) : null);
  if (segment && notification.targetUrl) {
    return notification.targetUrl.includes(`/chats/${segment}`);
  }

  return false;
}

export default matchesChatNotification;
