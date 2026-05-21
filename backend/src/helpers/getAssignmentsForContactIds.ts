import ContactAssignment from "../models/ContactAssignment";
import User from "../models/User";

export type ContactAssignmentUserDto = {
  id: number;
  name: string;
  email: string;
  profile: string;
};

export type ContactAssignmentDto = {
  id: number;
  contactId: number;
  userId: number;
  companyId: number;
  assignedByUserId: number | null;
  user: ContactAssignmentUserDto;
};

const userAttributes = ["id", "name", "email", "profile"];

export default async function getAssignmentsForContactIds(
  contactIds: number[],
  companyId: number
): Promise<Map<number, ContactAssignmentDto[]>> {
  const map = new Map<number, ContactAssignmentDto[]>();
  if (!contactIds.length) return map;

  const rows = await ContactAssignment.findAll({
    where: { contactId: contactIds, companyId },
    include: [
      {
        model: User,
        as: "user",
        attributes: userAttributes,
        required: true
      }
    ],
    order: [["createdAt", "ASC"]]
  });

  for (const row of rows) {
    const u = row.user;
    if (!u) continue;
    const dto: ContactAssignmentDto = {
      id: row.id,
      contactId: row.contactId,
      userId: row.userId,
      companyId: row.companyId,
      assignedByUserId: row.assignedByUserId ?? null,
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        profile: u.profile
      }
    };
    const list = map.get(row.contactId) ?? [];
    list.push(dto);
    map.set(row.contactId, list);
  }

  return map;
}
