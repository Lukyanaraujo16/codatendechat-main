import { Op } from "sequelize";
import AppError from "../errors/AppError";
import Contact from "../models/Contact";
import ContactAssignment from "../models/ContactAssignment";

export type ContactAccessUser = {
  id?: number | string;
  profile?: string;
  supportMode?: boolean;
  super?: boolean;
};

export function canViewAllCompanyContacts(user: ContactAccessUser): boolean {
  if (user.super === true) return true;
  if (user.supportMode === true) return true;
  const profile = String(user.profile || "");
  return profile === "admin" || profile === "supervisor";
}

export function canManageContactAssignments(user: ContactAccessUser): boolean {
  if (user.super === true) return true;
  if (user.supportMode === true) return true;
  return String(user.profile || "") === "admin";
}

export async function userHasContactAssignment(
  contactId: number,
  userId: number,
  companyId: number
): Promise<boolean> {
  const row = await ContactAssignment.findOne({
    where: { contactId, userId, companyId }
  });
  return Boolean(row);
}

export async function assertUserCanAccessContact(
  contactId: number,
  companyId: number,
  user: ContactAccessUser
): Promise<Contact> {
  const contact = await Contact.findByPk(contactId);
  if (!contact) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }
  if (contact.companyId !== companyId) {
    throw new AppError("Não é possível acessar registro de outra empresa", 403);
  }

  if (canViewAllCompanyContacts(user)) {
    return contact;
  }

  const uid = Number(user.id);
  const has = await userHasContactAssignment(contact.id, uid, companyId);
  if (!has) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  return contact;
}

/** Restringe listagem a contatos atribuídos ao usuário comum. */
export async function getAssignedContactIdsForUser(
  userId: number,
  companyId: number
): Promise<number[]> {
  const rows = await ContactAssignment.findAll({
    where: { userId, companyId },
    attributes: ["contactId"]
  });
  return [...new Set(rows.map((r) => r.contactId))];
}

export function applyAssignedContactFilter(
  whereClause: Record<string, unknown>,
  assignedContactIds: number[]
): Record<string, unknown> {
  if (!assignedContactIds.length) {
    return { ...whereClause, id: { [Op.in]: [-1] } };
  }
  const existingId = whereClause.id as { [Op.in]?: number[] } | undefined;
  if (existingId && existingId[Op.in]) {
    const intersection = existingId[Op.in].filter((id) =>
      assignedContactIds.includes(id)
    );
    return {
      ...whereClause,
      id: { [Op.in]: intersection.length ? intersection : [-1] }
    };
  }
  return { ...whereClause, id: { [Op.in]: assignedContactIds } };
}
