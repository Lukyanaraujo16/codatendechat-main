import { Op, Sequelize, fn, col } from "sequelize";
import ContactLabel from "../../models/ContactLabel";
import ContactLabelRelation from "../../models/ContactLabelRelation";
import User from "../../models/User";

export type ContactLabelAdminRow = {
  id: number;
  name: string;
  color: string;
  description: string | null;
  companyId: number;
  createdBy: number | null;
  createdAt: Date;
  updatedAt: Date;
  contactCount: number;
  lastUsedAt: string | null;
  createdByName: string | null;
};

type Request = {
  companyId: number;
  searchParam?: string;
  usageFilter?: "all" | "used" | "unused";
};

const ListContactLabelsAdminService = async ({
  companyId,
  searchParam = "",
  usageFilter = "all"
}: Request): Promise<ContactLabelAdminRow[]> => {
  const where: any = { companyId };
  const trimmed = searchParam.trim();

  if (trimmed) {
    const q = `%${trimmed.toLowerCase()}%`;
    where[Op.or] = [
      Sequelize.where(
        Sequelize.fn("LOWER", Sequelize.col("ContactLabel.name")),
        { [Op.like]: q }
      ),
      Sequelize.where(
        Sequelize.fn("LOWER", Sequelize.fn("COALESCE", Sequelize.col("ContactLabel.description"), "")),
        { [Op.like]: q }
      )
    ];
  }

  const labels = await ContactLabel.findAll({
    where,
    include: [
      {
        model: User,
        as: "creator",
        attributes: ["id", "name"],
        required: false
      }
    ],
    order: [["name", "ASC"]]
  });

  if (!labels.length) {
    return [];
  }

  const labelIds = labels.map((l) => l.id);

  const usageRows = await ContactLabelRelation.findAll({
    where: { companyId, labelId: { [Op.in]: labelIds } },
    attributes: [
      "labelId",
      [fn("COUNT", fn("DISTINCT", col("contactId"))), "contactCount"],
      [fn("MAX", col("createdAt")), "lastUsedAt"]
    ],
    group: ["labelId"],
    raw: true
  });

  const usageMap = new Map<
    number,
    { contactCount: number; lastUsedAt: string | null }
  >();
  for (const row of usageRows as any[]) {
    const lid = Number(row.labelId);
    usageMap.set(lid, {
      contactCount: Number(row.contactCount) || 0,
      lastUsedAt: row.lastUsedAt
        ? new Date(row.lastUsedAt).toISOString()
        : null
    });
  }

  let rows: ContactLabelAdminRow[] = labels.map((label) => {
    const usage = usageMap.get(label.id) ?? {
      contactCount: 0,
      lastUsedAt: null
    };
    return {
      id: label.id,
      name: label.name,
      color: label.color,
      description: label.description,
      companyId: label.companyId,
      createdBy: label.createdBy,
      createdAt: label.createdAt,
      updatedAt: label.updatedAt,
      contactCount: usage.contactCount,
      lastUsedAt: usage.lastUsedAt,
      createdByName: label.creator?.name ?? null
    };
  });

  if (usageFilter === "used") {
    rows = rows.filter((r) => r.contactCount > 0);
  } else if (usageFilter === "unused") {
    rows = rows.filter((r) => r.contactCount === 0);
  }

  return rows;
};

export default ListContactLabelsAdminService;
