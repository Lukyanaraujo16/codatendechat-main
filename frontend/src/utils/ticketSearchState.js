export const EMPTY_TICKET_SEARCH = {
  open: "",
  pending: "",
  chatbot: "",
  closed: "",
  groups: "",
  filters: "",
};

export function getActiveTicketSearchKey(tab, inboxSubTab) {
  if (tab === "open") {
    if (inboxSubTab === "pending" || inboxSubTab === "chatbot") {
      return inboxSubTab;
    }
    return "open";
  }
  if (tab === "closed") return "closed";
  if (tab === "groups") return "groups";
  if (tab === "filters") return "filters";
  return "open";
}

export function getTicketSearchPlaceholderKey(tab, inboxSubTab) {
  const searchKey = getActiveTicketSearchKey(tab, inboxSubTab);
  return `tickets.search.placeholders.${searchKey}`;
}

export function normalizeTicketSearchTerm(raw) {
  return String(raw ?? "").toLowerCase().trim();
}

export function filterTicketsBySearchParam(tickets, searchParam) {
  const q = normalizeTicketSearchTerm(searchParam);
  if (!q || !Array.isArray(tickets)) {
    return tickets || [];
  }

  return tickets.filter((ticket) => {
    const name = ticket?.contact?.name?.toLowerCase() || "";
    const number = String(ticket?.contact?.number ?? "").toLowerCase();
    const lastMessage = String(ticket?.lastMessage ?? "").toLowerCase();
    return (
      name.includes(q) || number.includes(q) || lastMessage.includes(q)
    );
  });
}
