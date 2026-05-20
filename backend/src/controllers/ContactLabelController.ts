import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import AppError from "../errors/AppError";

import ListContactLabelsService from "../services/ContactLabelServices/ListContactLabelsService";
import CreateContactLabelService from "../services/ContactLabelServices/CreateContactLabelService";
import UpdateContactLabelService from "../services/ContactLabelServices/UpdateContactLabelService";
import DeleteContactLabelService from "../services/ContactLabelServices/DeleteContactLabelService";
import GetContactLabelsService from "../services/ContactServices/GetContactLabelsService";
import SetContactLabelsService from "../services/ContactServices/SetContactLabelsService";
import GetContactLabelStatsService from "../services/ContactLabelServices/GetContactLabelStatsService";
import ListContactLabelsAdminService from "../services/ContactLabelServices/ListContactLabelsAdminService";
import GetContactLabelUsageService from "../services/ContactLabelServices/GetContactLabelUsageService";

export const stats = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const data = await GetContactLabelStatsService(companyId);
  return res.status(200).json(data);
};

export const manage = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { searchParam, usageFilter } = req.query as {
    searchParam?: string;
    usageFilter?: "all" | "used" | "unused";
  };

  const labels = await ListContactLabelsAdminService({
    companyId,
    searchParam,
    usageFilter: usageFilter || "all"
  });

  return res.status(200).json(labels);
};

export const usage = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { labelId } = req.params;

  const data = await GetContactLabelUsageService(Number(labelId), companyId);
  return res.status(200).json(data);
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { searchParam } = req.query as { searchParam?: string };

  const labels = await ListContactLabelsService({
    companyId,
    searchParam
  });

  return res.status(200).json(labels);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId, id: userId } = req.user;
  const { name, color, description } = req.body;

  const label = await CreateContactLabelService({
    name,
    color,
    description,
    companyId,
    createdBy: Number(userId)
  });

  const io = getIO();
  io.to(`company-${companyId}-mainchannel`).emit("contactLabel", {
    action: "create",
    label
  });

  return res.status(200).json(label);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { labelId } = req.params;
  const { name, color, description } = req.body;

  const label = await UpdateContactLabelService({
    labelId: Number(labelId),
    companyId,
    name,
    color,
    description
  });

  const io = getIO();
  io.to(`company-${companyId}-mainchannel`).emit("contactLabel", {
    action: "update",
    label
  });

  return res.status(200).json(label);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { labelId } = req.params;
  const { mode, replaceWith } = req.body as {
    mode?: "remove" | "replace";
    replaceWith?: number;
  };

  await DeleteContactLabelService({
    labelId: Number(labelId),
    companyId,
    mode: mode || "remove",
    replaceWith: replaceWith != null ? Number(replaceWith) : undefined
  });

  const io = getIO();
  io.to(`company-${companyId}-mainchannel`).emit("contactLabel", {
    action: "delete",
    labelId: Number(labelId)
  });

  return res.status(200).json({ message: "OK" });
};

export const contactLabels = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const { contactId } = req.params;

  const labels = await GetContactLabelsService({
    contactId: Number(contactId),
    companyId
  });

  return res.status(200).json(labels);
};

export const setContactLabels = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId, id: userId } = req.user;
  const { contactId } = req.params;
  const { labelIds } = req.body as { labelIds?: number[] };

  if (!Array.isArray(labelIds)) {
    throw new AppError("ERR_VALIDATION_ERROR", 400);
  }

  const labels = await SetContactLabelsService({
    contactId: Number(contactId),
    companyId,
    labelIds,
    userId: Number(userId)
  });

  const io = getIO();
  io.to(`company-${companyId}-contact`).emit("contact", {
    action: "update",
    contact: {
      id: Number(contactId),
      labels
    }
  });

  return res.status(200).json(labels);
};
