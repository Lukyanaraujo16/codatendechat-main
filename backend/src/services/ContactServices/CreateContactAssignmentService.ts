import AppError from "../../errors/AppError";
import ContactAssignment from "../../models/ContactAssignment";
import User from "../../models/User";

interface Request {
  contactId: number;
  userId: number;
  companyId: number;
  assignedByUserId: number;
}

const CreateContactAssignmentService = async ({
  contactId,
  userId,
  companyId,
  assignedByUserId
}: Request): Promise<ContactAssignment> => {
  const targetUser = await User.findByPk(userId);
  if (
    !targetUser ||
    targetUser.companyId == null ||
    Number(targetUser.companyId) !== Number(companyId)
  ) {
    throw new AppError("ERR_USER_NOT_FOUND", 404);
  }

  const existing = await ContactAssignment.findOne({
    where: { contactId, userId, companyId }
  });
  if (existing) {
    return existing;
  }

  return ContactAssignment.create({
    contactId,
    userId,
    companyId,
    assignedByUserId
  });
};

export default CreateContactAssignmentService;
