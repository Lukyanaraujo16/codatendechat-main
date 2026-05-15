import Ticket from "../../models/Ticket";
import DeleteTicketService from "./DeleteTicketService";
import { logger } from "../../utils/logger";

export type BatchDeleteFailedItem = {
  id: number;
  reason: string;
};

export type BatchDeleteTicketsResult = {
  deletedCount: number;
  failedCount: number;
  deletedIds: number[];
  failedIds: BatchDeleteFailedItem[];
};

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: string }).message);
  }
  return String(err);
}

const BatchDeleteTicketsService = async (
  ticketIds: number[],
  companyId: number,
  deletedBy?: number | null
): Promise<{
  deleted: { id: number; status: string; queueId: number | null }[];
  result: BatchDeleteTicketsResult;
}> => {
  const deleted: { id: number; status: string; queueId: number | null }[] = [];
  const failedIds: BatchDeleteFailedItem[] = [];

  for (const rawId of ticketIds) {
    const id = Number(rawId);
    if (!Number.isFinite(id) || id <= 0) {
      failedIds.push({ id: rawId as number, reason: "invalid ticket id" });
      continue;
    }

    let ticketMeta: {
      status?: string;
      queueId?: number | null;
      whatsappId?: number | null;
      userId?: number | null;
    } = {};

    try {
      const existing = await Ticket.findOne({
        where: { id, companyId },
        attributes: ["id", "status", "queueId", "whatsappId", "userId", "contactId"]
      });
      ticketMeta = existing
        ? {
            status: existing.status,
            queueId: existing.queueId ?? null,
            whatsappId: existing.whatsappId ?? null,
            userId: existing.userId ?? null
          }
        : {};

      const snapshot = await DeleteTicketService(
        String(id),
        companyId,
        deletedBy ?? null
      );
      deleted.push({
        id: snapshot.id,
        status: snapshot.status,
        queueId: snapshot.queueId ?? null
      });
    } catch (err) {
      const reason = extractErrorMessage(err);
      failedIds.push({ id, reason });
      logger.warn(
        {
          err,
          ticketId: id,
          companyId,
          deletedBy: deletedBy ?? null,
          errorMessage: reason,
          errorStack: err instanceof Error ? err.stack : undefined,
          ticketStatus: ticketMeta.status ?? null,
          queueId: ticketMeta.queueId ?? null,
          whatsappId: ticketMeta.whatsappId ?? null,
          ticketUserId: ticketMeta.userId ?? null
        },
        "[TicketBatchDelete] item failed"
      );
    }
  }

  return {
    deleted,
    result: {
      deletedCount: deleted.length,
      failedCount: failedIds.length,
      deletedIds: deleted.map((d) => d.id),
      failedIds
    }
  };
};

export default BatchDeleteTicketsService;
