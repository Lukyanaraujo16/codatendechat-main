import { Op } from "sequelize";
import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import ContactLabel from "../../models/ContactLabel";
import ContactLabelRelation from "../../models/ContactLabelRelation";
import sequelize from "../../database";
import {
  assertContactLabelRelationsTable,
  CONTACT_LABEL_RELATIONS_TABLE,
  ensureContactLabelRelationsReady,
  logContactLabelRelationsDbError,
  logContactLabelRelationsDiagnostics
} from "../../helpers/contactLabelRelationsTable";
import { isMissingRelationError } from "../../helpers/optionalTableQuery";

interface Request {
  contactId: number;
  companyId: number;
  labelIds: number[];
  userId: number;
}

const normalizeLabelIds = (labelIds: number[]): number[] => [
  ...new Set(
    labelIds
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0)
  )
];

const loadLabelsForContact = async (
  contactId: number,
  companyId: number
): Promise<ContactLabel[]> => {
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

  try {
    await ensureContactLabelRelationsReady(sequelize);
  } catch (err) {
    if (err instanceof AppError) throw err;
    await logContactLabelRelationsDiagnostics(sequelize, "ensureContactLabelRelationsReady failed", {
      contactId,
      companyId
    });
    assertContactLabelRelationsTable();
  }

  const uniqueIds = normalizeLabelIds(labelIds);

  if (uniqueIds.length > 0) {
    const owned = await ContactLabel.findAll({
      where: { companyId, id: { [Op.in]: uniqueIds } },
      attributes: ["id"]
    });
    if (owned.length !== uniqueIds.length) {
      throw new AppError(
        "ERR_INVALID_LABEL_IDS",
        400,
        "Uma ou mais etiquetas não pertencem à empresa ou não existem."
      );
    }
  }

  try {
    await sequelize.transaction(async (transaction) => {
      await ContactLabelRelation.destroy({
        where: { contactId, companyId },
        transaction
      });

      if (uniqueIds.length > 0) {
        await ContactLabelRelation.bulkCreate(
          uniqueIds.map((labelId) => ({
            contactId,
            labelId,
            companyId,
            createdBy: Number.isFinite(userId) && userId > 0 ? userId : null
          })),
          { transaction }
        );
      }
    });
  } catch (err) {
    if (isMissingRelationError(err, CONTACT_LABEL_RELATIONS_TABLE)) {
      await logContactLabelRelationsDiagnostics(sequelize, "SQL missing relation on apply", {
        contactId,
        companyId,
        labelIds: uniqueIds
      });
      logContactLabelRelationsDbError("apply", { contactId, companyId, labelIds: uniqueIds }, err);
      assertContactLabelRelationsTable();
    }
    logContactLabelRelationsDbError("apply", { contactId, companyId, labelIds: uniqueIds }, err);
    throw err;
  }

  return loadLabelsForContact(contactId, companyId);
};

export default SetContactLabelsService;
