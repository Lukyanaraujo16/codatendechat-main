import DeleteTicketService from "./DeleteTicketService";
import { logger } from "../../utils/logger";

export type BatchDeleteTicketsResult = {
  deletedCount: number;
  failedCount: number;
};

const BatchDeleteTicketsService = async (
  ticketIds: number[],
  companyId: number,
  deletedBy?: number | null
): Promise<{
  deleted: { id: number; status: string; queueId: number | null }[];
  result: BatchDeleteTicketsResult;
}> => {
  const deleted: { id: number; status: string; queueId: number | null }[] = [];
  let failedCount = 0;

  for (const rawId of ticketIds) {
    const id = Number(rawId);
    if (!Number.isFinite(id) || id <= 0) {
      failedCount += 1;
      continue;
    }
    try {
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
      failedCount += 1;
      logger.warn(
        { err, ticketId: id, companyId },
        "[TicketDelete] batch item failed"
      );
    }
  }

  return {
    deleted,
    result: {
      deletedCount: deleted.length,
      failedCount
    }
  };
};

export default BatchDeleteTicketsService;
