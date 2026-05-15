import AppError from "../../errors/AppError";
import Help from "../../models/Help";

interface Data {
  id: number | string;
  title: string;
  description?: string;
  video?: string;
  link?: string;
  thumbnailUrl?: string;
  category?: string;
  order?: number;
  isFeatured?: boolean;
}

const UpdateService = async (data: Data): Promise<Help> => {
  const { id } = data;

  const record = await Help.findByPk(id);

  if (!record) {
    throw new AppError("ERR_NO_HELP_FOUND", 404);
  }

  const { id: _id, ...payload } = data;
  await record.update(payload);

  return record;
};

export default UpdateService;
