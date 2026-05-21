import { Request, Response } from "express";
import AppError from "../errors/AppError";
import {
  assertUserCanAccessContact,
  canManageContactAssignments
} from "../helpers/contactAccess";
import ListContactAssignmentsService from "../services/ContactServices/ListContactAssignmentsService";
import CreateContactAssignmentService from "../services/ContactServices/CreateContactAssignmentService";
import RemoveContactAssignmentService from "../services/ContactServices/RemoveContactAssignmentService";
import ReplaceContactAssignmentsService from "../services/ContactServices/ReplaceContactAssignmentsService";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { contactId } = req.params;
  const { companyId, id: userId, profile, supportMode } = req.user;
  const accessUser = {
    id: userId,
    profile,
    supportMode,
    super: (req.user as { super?: boolean }).super
  };

  await assertUserCanAccessContact(Number(contactId), companyId, accessUser);

  const assignments = await ListContactAssignmentsService({
    contactId: Number(contactId),
    companyId
  });

  return res.json({ assignments });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { contactId } = req.params;
  const { userId: targetUserId } = req.body as { userId?: number };
  const { companyId, id: actorId, profile, supportMode } = req.user;
  const accessUser = {
    id: actorId,
    profile,
    supportMode,
    super: (req.user as { super?: boolean }).super
  };

  if (!canManageContactAssignments(accessUser)) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  if (!targetUserId) {
    throw new AppError("ERR_VALIDATION_ERROR", 400);
  }

  await assertUserCanAccessContact(Number(contactId), companyId, accessUser);

  await CreateContactAssignmentService({
    contactId: Number(contactId),
    userId: Number(targetUserId),
    companyId,
    assignedByUserId: Number(actorId)
  });

  const assignments = await ListContactAssignmentsService({
    contactId: Number(contactId),
    companyId
  });

  return res.status(200).json({ assignments });
};

export const replace = async (req: Request, res: Response): Promise<Response> => {
  const { contactId } = req.params;
  const { userIds } = req.body as { userIds?: number[] };
  const { companyId, id: actorId, profile, supportMode } = req.user;

  if (
    !canManageContactAssignments({
      profile,
      supportMode,
      super: (req.user as { super?: boolean }).super
    })
  ) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const assignments = await ReplaceContactAssignmentsService({
    contactId: Number(contactId),
    companyId,
    userIds: Array.isArray(userIds) ? userIds : [],
    assignedByUserId: Number(actorId)
  });

  return res.status(200).json({ assignments });
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { contactId, userId: targetUserId } = req.params;
  const { companyId, profile, supportMode } = req.user;

  if (
    !canManageContactAssignments({
      profile,
      supportMode,
      super: (req.user as { super?: boolean }).super
    })
  ) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  await RemoveContactAssignmentService({
    contactId: Number(contactId),
    userId: Number(targetUserId),
    companyId
  });

  const assignments = await ListContactAssignmentsService({
    contactId: Number(contactId),
    companyId
  });

  return res.json({ assignments });
};
