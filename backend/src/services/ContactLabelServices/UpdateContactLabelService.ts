import * as Yup from "yup";
import { Op, Sequelize } from "sequelize";
import AppError from "../../errors/AppError";
import ContactLabel from "../../models/ContactLabel";
import { DEFAULT_CONTACT_LABEL_COLOR } from "../../helpers/contactLabelColors";

interface Request {
  labelId: number;
  companyId: number;
  name?: string;
  color?: string;
  description?: string | null;
}

const UpdateContactLabelService = async ({
  labelId,
  companyId,
  name,
  color,
  description
}: Request): Promise<ContactLabel> => {
  const label = await ContactLabel.findOne({
    where: { id: labelId, companyId }
  });

  if (!label) {
    throw new AppError("ERR_NO_CONTACT_LABEL_FOUND", 404);
  }

  if (name !== undefined) {
    const schema = Yup.object().shape({
      name: Yup.string().required().trim().min(1).max(80)
    });
    try {
      await schema.validate({ name });
    } catch (err: any) {
      throw new AppError(err.message, 400);
    }

    const trimmed = name.trim();
    const duplicate = await ContactLabel.findOne({
      where: {
        companyId,
        id: { [Op.ne]: labelId },
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

    label.name = trimmed;
  }

  if (color !== undefined) {
    label.color =
      (color && String(color).trim()) || DEFAULT_CONTACT_LABEL_COLOR;
  }

  if (description !== undefined) {
    label.description =
      description == null ? null : String(description).trim() || null;
  }

  await label.save();
  return label;
};

export default UpdateContactLabelService;
