import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import ContactLabel from "../../models/ContactLabel";
import ContactLabelRelation from "../../models/ContactLabelRelation";
import { isContactLabelRelationsTableAvailable } from "../../helpers/contactLabelRelationsTable";
import { logger } from "../../utils/logger";
import { isMissingRelationError } from "../../helpers/optionalTableQuery";
import { CONTACT_LABEL_RELATIONS_TABLE } from "../../helpers/contactLabelRelationsTable";

interface Request {
  contactId: number;
  companyId: number;
}

const GetContactLabelsService = async ({
  contactId,
  companyId
}: Request): Promise<ContactLabel[]> => {
  const contact = await Contact.findOne({
    where: { id: contactId, companyId }
  });

  if (!contact) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  if (!(await isContactLabelRelationsTableAvailable({ refresh: true }))) {
    return [];
  }

  try {
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
  } catch (err) {
    if (isMissingRelationError(err, CONTACT_LABEL_RELATIONS_TABLE)) {
      logger.warn(
        { contactId, companyId },
        "[ContactLabels] get skipped — relations table missing"
      );
      return [];
    }
    throw err;
  }
};

export default GetContactLabelsService;
