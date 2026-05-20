export const NOTIFICATION_SOUND_TYPE_IDS = {
  newMessage: "newMessage",
  openConversationMessage: "openConversationMessage",
};

export function getCurrentTicketFromRoute(pathname = "") {
  const path = pathname || "";
  const match = path.match(/^\/tickets\/([^/?#]+)/);
  if (!match) {
    return null;
  }
  const segment = match[1];
  return { id: segment, uuid: segment };
}

function ticketsMatch(currentTicket, incomingTicket) {
  if (!currentTicket || !incomingTicket) {
    return false;
  }

  const currentIds = [
    currentTicket.id,
    currentTicket.uuid,
  ]
    .filter((v) => v != null && v !== "")
    .map(String);

  const incomingIds = [
    incomingTicket.id,
    incomingTicket.uuid,
    incomingTicket.ticketId,
    incomingTicket.ticketUuid,
  ]
    .filter((v) => v != null && v !== "")
    .map(String);

  return currentIds.some((c) => incomingIds.includes(c));
}

export function getNotificationSoundType({
  route,
  currentTicket,
  incomingTicket,
} = {}) {
  const pathname =
    route || (typeof window !== "undefined" ? window.location.pathname : "");
  const inTickets = pathname.includes("/tickets");
  const resolvedCurrent =
    currentTicket || getCurrentTicketFromRoute(pathname);
  const sameConversation = ticketsMatch(resolvedCurrent, incomingTicket);

  if (inTickets && sameConversation) {
    return NOTIFICATION_SOUND_TYPE_IDS.openConversationMessage;
  }

  return NOTIFICATION_SOUND_TYPE_IDS.newMessage;
}

export default getNotificationSoundType;
