import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import ContactAssignment from "../../models/ContactAssignment";
import User from "../../models/User";

interface Request {
  contactId: number;
  companyId: number;
}

const ListContactAssignmentsService = async ({
  contactId,
  companyId
}: Request) => {
  const contact = await Contact.findByPk(contactId);
  if (!contact || contact.companyId !== companyId) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  const assignments = await ContactAssignment.findAll({
    where: { contactId, companyId },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "email", "profile"],
        required: true
      }
    ],
    order: [["createdAt", "ASC"]]
  });

  return assignments.map((row) => ({
    id: row.id,
    contactId: row.contactId,
    userId: row.userId,
    companyId: row.companyId,
    assignedByUserId: row.assignedByUserId ?? null,
    user: row.user
      ? {
          id: row.user.id,
          name: row.user.name,
          email: row.user.email,
          profile: row.user.profile
        }
      : null
  }));
};

export default ListContactAssignmentsService;
