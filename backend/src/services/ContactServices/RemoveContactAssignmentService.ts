import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import ContactAssignment from "../../models/ContactAssignment";

interface Request {
  contactId: number;
  userId: number;
  companyId: number;
}

const RemoveContactAssignmentService = async ({
  contactId,
  userId,
  companyId
}: Request): Promise<void> => {
  const contact = await Contact.findByPk(contactId);
  if (!contact || contact.companyId !== companyId) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  const remaining = await ContactAssignment.count({
    where: { contactId, companyId }
  });

  const row = await ContactAssignment.findOne({
    where: { contactId, userId, companyId }
  });
  if (!row) {
    throw new AppError("ERR_CONTACT_ASSIGNMENT_NOT_FOUND", 404);
  }

  if (remaining <= 1) {
    throw new AppError("ERR_CONTACT_REQUIRES_ASSIGNEE", 400);
  }

  await row.destroy();
};

export default RemoveContactAssignmentService;
