import Contact from "../../models/Contact";
import AppError from "../../errors/AppError";
import { FindOptions, Op } from "sequelize";

export interface SearchContactParams {
  companyId: string | number;
  name?: string;
  /** Quando false, oculta grupos não liberados para usuários comuns. */
  includeHiddenGroups?: boolean;
}

const SimpleListService = async ({
  name,
  companyId,
  includeHiddenGroups = true
}: SearchContactParams): Promise<Contact[]> => {
  let options: FindOptions = {
    order: [
      ['name', 'ASC']
    ]
  }

  if (name) {
    options.where = {
      name: {
        [Op.like]: `%${name}%`
      }
    }
  }

  options.where = {
    ...options.where,
    companyId,
    ...(includeHiddenGroups
      ? {}
      : {
          [Op.or]: [
            { isGroup: false },
            { isGroup: true, groupVisible: true }
          ]
        })
  }

  const contacts = await Contact.findAll(options);

  if (!contacts) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  return contacts;
};

export default SimpleListService;
