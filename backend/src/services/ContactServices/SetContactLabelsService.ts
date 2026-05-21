import { Op } from "sequelize";
import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import ContactLabel from "../../models/ContactLabel";
import ContactLabelRelation from "../../models/ContactLabelRelation";
import sequelize from "../../database";
import {
  assertContactLabelRelationsTable,
  CONTACT_LABEL_RELATIONS_TABLE,
  getContactLabelRelationsTableName,
  isContactLabelRelationsTableAvailable,
  logContactLabelRelationsDbError
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

  if (!(await isContactLabelRelationsTableAvailable({ refresh: true }))) {
    const resolved = await getContactLabelRelationsTableName({ refresh: true });
    if (!resolved) {
      assertContactLabelRelationsTable();
    }
    throw new AppError(
      "ERR_CONTACT_LABEL_RELATIONS_TABLE_MISSING",
      503,
      `Tabela encontrada como "${resolved}" mas o sistema espera "${CONTACT_LABEL_RELATIONS_TABLE}". Execute: npm run build && npm run db:migrate`
    );
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
      logContactLabelRelationsDbError("apply", { contactId, companyId, labelIds: uniqueIds }, err);
      assertContactLabelRelationsTable();
    }
    logContactLabelRelationsDbError("apply", { contactId, companyId, labelIds: uniqueIds }, err);
    throw err;
  }

  return loadLabelsForContact(contactId, companyId);
};

export default SetContactLabelsService;
