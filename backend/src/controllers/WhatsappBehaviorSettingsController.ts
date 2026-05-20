import { Request, Response } from "express";
import AppError from "../errors/AppError";
import BulkUpdateWhatsappBehaviorSettingsService, {
  listWhatsappBehaviorSettingsForCompany
} from "../services/WhatsappService/BulkUpdateWhatsappBehaviorSettingsService";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const companyId = Number(req.user?.companyId);
  if (!Number.isFinite(companyId)) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
  const rows = await listWhatsappBehaviorSettingsForCompany(companyId);
  return res.status(200).json(rows);
};

export const bulkUpdate = async (req: Request, res: Response): Promise<Response> => {
  const companyId = Number(req.user?.companyId);
  if (!Number.isFinite(companyId)) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
  const { whatsappIds, settings } = req.body as {
    whatsappIds?: number[];
    settings?: Record<string, unknown>;
  };
  if (!Array.isArray(whatsappIds) || !settings || typeof settings !== "object") {
    throw new AppError("ERR_VALIDATION_ERROR", 400);
  }
  const result = await BulkUpdateWhatsappBehaviorSettingsService({
    companyId,
    whatsappIds,
    settings: settings as Parameters<
      typeof BulkUpdateWhatsappBehaviorSettingsService
    >[0]["settings"]
  });
  const rows = await listWhatsappBehaviorSettingsForCompany(companyId);
  return res.status(200).json({ ...result, connections: rows });
};
