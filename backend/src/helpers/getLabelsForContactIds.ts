import { Op } from "sequelize";
import ContactLabel from "../models/ContactLabel";
import ContactLabelRelation from "../models/ContactLabelRelation";

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

  contactIds.forEach((id) => map.set(id, []));

  const relations = await ContactLabelRelation.findAll({
    where: {
      companyId,
      contactId: { [Op.in]: contactIds }
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

  return map;
};

export default getLabelsForContactIds;
