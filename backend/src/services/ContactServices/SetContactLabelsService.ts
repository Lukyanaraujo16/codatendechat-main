import { Op } from "sequelize";
import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import ContactLabel from "../../models/ContactLabel";
import ContactLabelRelation from "../../models/ContactLabelRelation";

interface Request {
  contactId: number;
  companyId: number;
  labelIds: number[];
  userId: number;
}

const SetContactLabelsService = async ({
  contactId,
  companyId,
  labelIds,
  userId
}: Request): Promise<ContactLabel[]> => {
  const contact = await Contact.findOne({
    where: { id: contactId, companyId }
  });

  if (!contact) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  const uniqueIds = [...new Set(labelIds.map((id) => Number(id)).filter((id) => id > 0))];

  if (uniqueIds.length > 0) {
    const owned = await ContactLabel.findAll({
      where: { companyId, id: { [Op.in]: uniqueIds } },
      attributes: ["id"]
    });
    if (owned.length !== uniqueIds.length) {
      throw new AppError("ERR_NO_PERMISSION", 403);
    }
  }

  await ContactLabelRelation.destroy({
    where: { contactId, companyId }
  });

  if (uniqueIds.length > 0) {
    await ContactLabelRelation.bulkCreate(
      uniqueIds.map((labelId) => ({
        contactId,
        labelId,
        companyId,
        createdBy: userId
      }))
    );
  }

  const relations = await ContactLabelRelation.findAll({
    where: { contactId, companyId },
    include: [
      {
        model: ContactLabel,
        as: "label",
        attributes: ["id", "name", "color", "description"]
      }
    ],
    order: [["createdAt", "ASC"]]
  });

  return relations
    .map((r) => r.label)
    .filter((l): l is ContactLabel => Boolean(l));
};

export default SetContactLabelsService;
