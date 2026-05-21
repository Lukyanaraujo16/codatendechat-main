import { Op } from "sequelize";
import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import ContactAssignment from "../../models/ContactAssignment";
import User from "../../models/User";
import CreateContactAssignmentService from "./CreateContactAssignmentService";
import ListContactAssignmentsService from "./ListContactAssignmentsService";

interface Request {
  contactId: number;
  companyId: number;
  userIds: number[];
  assignedByUserId: number;
}

const ReplaceContactAssignmentsService = async ({
  contactId,
  companyId,
  userIds,
  assignedByUserId
}: Request) => {
  const uniqueIds = [...new Set(userIds.map((id) => Number(id)).filter((id) => id > 0))];

  if (!uniqueIds.length) {
    throw new AppError("ERR_CONTACT_REQUIRES_ASSIGNEE", 400);
  }

  const contact = await Contact.findByPk(contactId);
  if (!contact || contact.companyId !== companyId) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  const users = await User.findAll({
    where: { id: { [Op.in]: uniqueIds }, companyId }
  });
  if (users.length !== uniqueIds.length) {
    throw new AppError("ERR_USER_NOT_FOUND", 404);
  }

  await ContactAssignment.destroy({ where: { contactId, companyId } });

  for (const userId of uniqueIds) {
    await CreateContactAssignmentService({
      contactId,
      userId,
      companyId,
      assignedByUserId
    });
  }

  return ListContactAssignmentsService({ contactId, companyId });
};

export default ReplaceContactAssignmentsService;
