import { fn, col } from "sequelize";
import AppError from "../../errors/AppError";
import ContactLabel from "../../models/ContactLabel";
import ContactLabelRelation from "../../models/ContactLabelRelation";

export type ContactLabelUsage = {
  contacts: number;
  lastUsedAt: string | null;
};

const GetContactLabelUsageService = async (
  labelId: number,
  companyId: number
): Promise<ContactLabelUsage> => {
  const label = await ContactLabel.findOne({
    where: { id: labelId, companyId }
  });

  if (!label) {
    throw new AppError("ERR_NO_CONTACT_LABEL_FOUND", 404);
  }

  const contacts = await ContactLabelRelation.count({
    where: { labelId, companyId },
    distinct: true,
    col: "contactId"
  });

  const lastRow = await ContactLabelRelation.findOne({
    where: { labelId, companyId },
    attributes: [[fn("MAX", col("createdAt")), "lastUsedAt"]],
    raw: true
  });

  const lastUsedAt = (lastRow as any)?.lastUsedAt;
  return {
    contacts,
    lastUsedAt: lastUsedAt
      ? new Date(lastUsedAt).toISOString()
      : null
  };
};

export default GetContactLabelUsageService;
