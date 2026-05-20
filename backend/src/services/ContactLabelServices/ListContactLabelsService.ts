import { Op, Sequelize } from "sequelize";
import ContactLabel from "../../models/ContactLabel";

interface Request {
  companyId: number;
  searchParam?: string;
}

const ListContactLabelsService = async ({
  companyId,
  searchParam = ""
}: Request): Promise<ContactLabel[]> => {
  const where: any = { companyId };

  const trimmed = searchParam.trim();
  if (trimmed) {
    where[Op.and] = Sequelize.where(
      Sequelize.fn("LOWER", Sequelize.col("ContactLabel.name")),
      { [Op.like]: `%${trimmed.toLowerCase()}%` }
    );
  }

  return ContactLabel.findAll({
    where,
    order: [["name", "ASC"]]
  });
};

export default ListContactLabelsService;
