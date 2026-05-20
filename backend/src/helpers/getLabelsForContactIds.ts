import { Op } from "sequelize";
import ContactLabel from "../models/ContactLabel";
import ContactLabelRelation from "../models/ContactLabelRelation";
import { logEnrichmentFailure } from "./enrichmentErrors";
import {
  getCachedContactLabels,
  getOpenTicketStore,
  setCachedContactLabels
} from "./openTicketRequestContext";

export type ContactLabelDto = {
  id: number;
  name: string;
  color: string;
  description?: string | null;
};

const getLabelsForContactIds = async (
  contactIds: number[],
  companyId: number
): Promise<Map<number, ContactLabelDto[]>> => {
  const map = new Map<number, ContactLabelDto[]>();
  if (!contactIds.length) {
    return map;
  }

  const uniqueIds = [...new Set(contactIds.filter((id) => id > 0))];
  const toFetch: number[] = [];

  for (const id of uniqueIds) {
    const cached = getCachedContactLabels(id);
    if (cached !== undefined) {
      map.set(id, cached);
    } else {
      map.set(id, []);
      toFetch.push(id);
    }
  }

  if (!toFetch.length) {
    return map;
  }

  try {
    const relations = await ContactLabelRelation.findAll({
      where: {
        companyId,
        contactId: { [Op.in]: toFetch }
      },
      include: [
        {
          model: ContactLabel,
          as: "label",
          attributes: ["id", "name", "color", "description"]
        }
      ],
      order: [["createdAt", "ASC"]]
    });

    for (const id of toFetch) {
      map.set(id, []);
    }

    for (const rel of relations) {
      const label = rel.label;
      if (!label) continue;
      const list = map.get(rel.contactId) ?? [];
      list.push({
        id: label.id,
        name: label.name,
        color: label.color,
        description: label.description
      });
      map.set(rel.contactId, list);
    }

    const cache = getOpenTicketStore()?.contactLabelsCache;
    for (const id of toFetch) {
      const labels = map.get(id) ?? [];
      if (cache) {
        setCachedContactLabels(id, labels);
      }
    }
  } catch (error) {
    logEnrichmentFailure(
      "contactLabels",
      { companyId, contactIdsCount: toFetch.length },
      error
    );
    for (const id of toFetch) {
      map.set(id, []);
      setCachedContactLabels(id, []);
    }
  }

  return map;
};

export default getLabelsForContactIds;
