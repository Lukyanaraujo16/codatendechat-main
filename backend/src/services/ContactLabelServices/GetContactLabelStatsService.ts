import { fn, col } from "sequelize";
import ContactLabel from "../../models/ContactLabel";
import ContactLabelRelation from "../../models/ContactLabelRelation";

export type ContactLabelStats = {
  total: number;
  used: number;
  unused: number;
  contactsTagged: number;
};

const GetContactLabelStatsService = async (
  companyId: number
): Promise<ContactLabelStats> => {
  const total = await ContactLabel.count({ where: { companyId } });

  const usedLabelRows = await ContactLabelRelation.findAll({
    where: { companyId },
    attributes: [[fn("DISTINCT", col("labelId")), "labelId"]],
    raw: true
  });
  const used = usedLabelRows.length;

  const contactsTagged = await ContactLabelRelation.count({
    where: { companyId },
    distinct: true,
    col: "contactId"
  });

  return {
    total,
    used,
    unused: Math.max(0, total - used),
    contactsTagged
  };
};

export default GetContactLabelStatsService;
