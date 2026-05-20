import Ticket from "../models/Ticket";
import getLabelsForContactIds from "./getLabelsForContactIds";

const attachContactLabelsToTickets = async (
  tickets: Ticket[],
  companyId: number
): Promise<void> => {
  const contactIds = [
    ...new Set(
      tickets
        .map((t) => t.contact?.id ?? (t as any).contactId)
        .filter((id): id is number => typeof id === "number" && id > 0)
    )
  ];

  if (!contactIds.length) return;

  const labelsMap = await getLabelsForContactIds(contactIds, companyId);

  for (const ticket of tickets) {
    const contact = ticket.contact;
    if (!contact) continue;
    const labels = labelsMap.get(contact.id) ?? [];
    (contact as any).setDataValue?.("labels", labels);
    (contact as any).labels = labels;
  }
};

export default attachContactLabelsToTickets;
