/** Marca notificações WhatsApp/atendimento que correspondem ao ticket aberto. */
export function matchesTicketNotification(notification, { ticketId, ticketUuid } = {}) {
  if (!notification || notification.type !== "whatsapp") {
    return false;
  }

  const idNum =
    ticketId != null && ticketId !== "" && !Number.isNaN(Number(ticketId))
      ? Number(ticketId)
      : null;
  const uuid =
    ticketUuid != null && ticketUuid !== "" ? String(ticketUuid) : null;

  if (idNum != null && Number(notification.ticketId) === idNum) {
    return true;
  }
  if (uuid && notification.ticketUuid && String(notification.ticketUuid) === uuid) {
    return true;
  }
  if (uuid && String(notification.ticketId) === uuid) {
    return true;
  }

  const segment = uuid || (idNum != null ? String(idNum) : null);
  if (segment && notification.targetUrl) {
    return notification.targetUrl.includes(`/tickets/${segment}`);
  }

  return false;
}

export default matchesTicketNotification;
