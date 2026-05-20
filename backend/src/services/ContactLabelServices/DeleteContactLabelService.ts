import { Op } from "sequelize";
import AppError from "../../errors/AppError";
import ContactLabel from "../../models/ContactLabel";
import ContactLabelRelation from "../../models/ContactLabelRelation";

export type DeleteContactLabelMode = "remove" | "replace";

interface Request {
  labelId: number;
  companyId: number;
  mode?: DeleteContactLabelMode;
  replaceWith?: number;
}

const DeleteContactLabelService = async ({
  labelId,
  companyId,
  mode = "remove",
  replaceWith
}: Request): Promise<void> => {
  const label = await ContactLabel.findOne({
    where: { id: labelId, companyId }
  });

  if (!label) {
    throw new AppError("ERR_NO_CONTACT_LABEL_FOUND", 404);
  }

  const relationCount = await ContactLabelRelation.count({
    where: { labelId, companyId }
  });

  if (relationCount > 0) {
    if (mode === "remove") {
      await ContactLabelRelation.destroy({
        where: { labelId, companyId }
      });
    } else if (mode === "replace") {
      if (!replaceWith || replaceWith === labelId) {
        throw new AppError("ERR_VALIDATION_ERROR", 400);
      }

      const target = await ContactLabel.findOne({
        where: { id: replaceWith, companyId }
      });
      if (!target) {
        throw new AppError("ERR_NO_CONTACT_LABEL_FOUND", 404);
      }

      const relations = await ContactLabelRelation.findAll({
        where: { labelId, companyId },
        attributes: ["id", "contactId"]
      });

      for (const rel of relations) {
        const existingTarget = await ContactLabelRelation.findOne({
          where: {
            contactId: rel.contactId,
            labelId: replaceWith,
            companyId
          }
        });

        if (existingTarget) {
          await rel.destroy();
        } else {
          await rel.update({ labelId: replaceWith });
        }
      }
    } else {
      throw new AppError("ERR_VALIDATION_ERROR", 400);
    }
  }

  await label.destroy();
};

export default DeleteContactLabelService;
