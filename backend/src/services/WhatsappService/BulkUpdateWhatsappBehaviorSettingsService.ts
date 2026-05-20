import { Op } from "sequelize";
import Whatsapp from "../../models/Whatsapp";
import AppError from "../../errors/AppError";
import {
  CallHandlingMode,
  GroupMessagesMode,
  listWhatsappBehaviorRows
} from "../../helpers/whatsappBehaviorSettings";

export type BehaviorSettingsPayload = {
  callHandlingMode?: CallHandlingMode;
  sendMessageOnCallReject?: boolean;
  callRejectMessage?: string | null;
  groupMessagesMode?: GroupMessagesMode;
};

type Input = {
  companyId: number;
  whatsappIds: number[];
  settings: BehaviorSettingsPayload;
};

const BulkUpdateWhatsappBehaviorSettingsService = async (
  input: Input
): Promise<{ updated: number }> => {
  const ids = [...new Set(input.whatsappIds.map((id) => Number(id)).filter((id) => id > 0))];
  if (ids.length === 0) {
    throw new AppError("ERR_VALIDATION_ERROR", 400);
  }

  const owned = await Whatsapp.findAll({
    where: { companyId: input.companyId, id: { [Op.in]: ids } },
    attributes: ["id"]
  });
  if (owned.length !== ids.length) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const patch: Record<string, unknown> = {};
  if (input.settings.callHandlingMode != null) {
    if (!["accept", "reject"].includes(input.settings.callHandlingMode)) {
      throw new AppError("ERR_VALIDATION_ERROR", 400);
    }
    patch.callHandlingMode = input.settings.callHandlingMode;
  }
  if (input.settings.sendMessageOnCallReject != null) {
    patch.sendMessageOnCallReject = Boolean(input.settings.sendMessageOnCallReject);
  }
  if (input.settings.callRejectMessage !== undefined) {
    patch.callRejectMessage =
      input.settings.callRejectMessage == null
        ? null
        : String(input.settings.callRejectMessage);
  }
  if (input.settings.groupMessagesMode != null) {
    if (!["ignore", "receive"].includes(input.settings.groupMessagesMode)) {
      throw new AppError("ERR_VALIDATION_ERROR", 400);
    }
    patch.groupMessagesMode = input.settings.groupMessagesMode;
  }

  if (Object.keys(patch).length === 0) {
    throw new AppError("ERR_VALIDATION_ERROR", 400);
  }

  const [updated] = await Whatsapp.update(patch, {
    where: { companyId: input.companyId, id: { [Op.in]: ids } }
  });

  return { updated };
};

export default BulkUpdateWhatsappBehaviorSettingsService;

export async function listWhatsappBehaviorSettingsForCompany(
  companyId: number
) {
  return listWhatsappBehaviorRows(companyId);
}
