import Contact from "../models/Contact";
import getLabelsForContactIds from "./getLabelsForContactIds";
import {
  getCachedContactLabels,
  setCachedContactLabels
} from "./openTicketRequestContext";

function applyLabelsToContact(
  contact: Contact,
  labels: { id: number; name: string; color: string; description?: string | null }[]
): void {
  (contact as any).setDataValue?.("labels", labels);
  (contact as any).labels = labels;
}

/** Anexa etiquetas ao contacto; usa cache request-scope quando disponível. */
export async function attachContactLabelsToContact(
  contact: Contact | undefined | null,
  companyId: number
): Promise<void> {
  if (!contact?.id) return;

  const cached = getCachedContactLabels(contact.id);
  if (cached !== undefined) {
    applyLabelsToContact(contact, cached);
    return;
  }

  const labelsMap = await getLabelsForContactIds([contact.id], companyId);
  const labels = labelsMap.get(contact.id) ?? [];
  setCachedContactLabels(contact.id, labels);
  applyLabelsToContact(contact, labels);
}

export default attachContactLabelsToContact;
