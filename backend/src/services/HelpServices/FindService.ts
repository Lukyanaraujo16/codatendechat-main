import Help from "../../models/Help";

const FindService = async (): Promise<Help[]> => {
  const notes: Help[] = await Help.findAll({
    order: [
      ["isFeatured", "DESC"],
      ["helpOrder", "ASC"],
      ["title", "ASC"]
    ]
  });

  return notes;
};

export default FindService;
