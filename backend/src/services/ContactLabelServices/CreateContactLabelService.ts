import * as Yup from "yup";
import { Op, Sequelize } from "sequelize";
import AppError from "../../errors/AppError";
import ContactLabel from "../../models/ContactLabel";
import {
  DEFAULT_CONTACT_LABEL_COLOR,
  MAX_CONTACT_LABELS_PER_COMPANY
} from "../../helpers/contactLabelColors";

interface Request {
  name: string;
  color?: string;
  description?: string | null;
  companyId: number;
  createdBy: number;
}

const CreateContactLabelService = async ({
  name,
  color,
  description,
  companyId,
  createdBy
}: Request): Promise<ContactLabel> => {
  const schema = Yup.object().shape({
    name: Yup.string().required().trim().min(1).max(80)
  });

  try {
    await schema.validate({ name });
  } catch (err: any) {
    throw new AppError(err.message, 400);
  }

  const trimmed = name.trim();
  const count = await ContactLabel.count({ where: { companyId } });
  if (count >= MAX_CONTACT_LABELS_PER_COMPANY) {
    throw new AppError(
      "Limite de etiquetas por empresa atingido (máximo 100).",
      400
    );
  }

  const duplicate = await ContactLabel.findOne({
    where: {
      companyId,
      [Op.and]: Sequelize.where(
        Sequelize.fn("LOWER", Sequelize.col("ContactLabel.name")),
        trimmed.toLowerCase()
      )
    }
  });

  if (duplicate) {
    throw new AppError(
      "Já existe uma etiqueta com este nome nesta empresa.",
      400
    );
  }

  const label = await ContactLabel.create({
    name: trimmed,
    color: (color && String(color).trim()) || DEFAULT_CONTACT_LABEL_COLOR,
    description: description != null ? String(description).trim() || null : null,
    companyId,
    createdBy
  });

  await label.reload();
  return label;
};

export default CreateContactLabelService;
