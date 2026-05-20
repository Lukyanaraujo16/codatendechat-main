import { decrementCompanyStorageUsage } from "../CompanyService/adjustCompanyStorageUsage";
import { formatBytesPtBr } from "../../helpers/companyStorage";
import { logger } from "../../utils/logger";
import {
  deleteCompanyMediaItemWithOptions,
  DeleteCompanyMediaSource
} from "./DeleteCompanyMediaItemService";

const ALLOWED: DeleteCompanyMediaSource[] = [
  "message",
  "quickMessage",
  "schedule",
  "campaign",
  "announcement",
  "fileListOption",
  "chatMessage",
  "flowImage",
  "flowAudio"
];

export type BatchDeleteCompanyMediaInputItem = {
  source: string;
  sourceId: string | number;
  id?: string;
  storageRel?: string | null;
  sizeBytes?: number;
};

export type BatchDeleteCompanyMediaResultItem = {
  id: string;
  sizeBytes: number;
  fileMissing?: boolean;
};

export type BatchDeleteCompanyMediaFailedItem = {
  id: string;
  source: string;
  sourceId: string;
  reason: string;
};

const BatchDeleteCompanyMediaService = async (
  companyId: number,
  rawItems: BatchDeleteCompanyMediaInputItem[],
  logMeta?: { userId?: number }
): Promise<{
  deletedCount: number;
  failedCount: number;
  freedBytes: number;
  freedFormatted: string;
  deleted: BatchDeleteCompanyMediaResultItem[];
  failed: BatchDeleteCompanyMediaFailedItem[];
}> => {
  logger.info(
    {
      companyId,
      userId: logMeta?.userId,
      itemCount: rawItems?.length ?? 0
    },
    "[CompanyMediaDelete] request"
  );

  const seen = new Set<string>();
  const queue: {
    source: DeleteCompanyMediaSource;
    sourceId: string;
    id: string;
    sizeBytes: number;
  }[] = [];

  for (const it of rawItems) {
    if (!it || typeof it !== "object") continue;
    const source = String(it.source || "") as DeleteCompanyMediaSource;
    const sid = it.sourceId;
    if (sid === "" || sid === undefined || sid === null) continue;
    if (!ALLOWED.includes(source)) continue;
    const sourceId = String(sid);
    const id =
      String(it.id || "").trim() || `${source}:${sourceId}`;
    const key = `${source}:${sourceId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    queue.push({
      source,
      sourceId,
      id,
      sizeBytes: Math.max(0, Number(it.sizeBytes) || 0)
    });
  }

  const deleted: BatchDeleteCompanyMediaResultItem[] = [];
  const failed: BatchDeleteCompanyMediaFailedItem[] = [];
  let totalFreed = 0;

  for (const it of queue) {
    try {
      const result = await deleteCompanyMediaItemWithOptions(
        companyId,
        it.source,
        it.sourceId,
        {
          deferStorageDecrement: true,
          knownSizeBytes: it.sizeBytes
        }
      );
      totalFreed += result.freedBytes;
      deleted.push({
        id: it.id,
        sizeBytes: result.freedBytes,
        fileMissing: result.fileMissing
      });
      logger.info(
        {
          companyId,
          userId: logMeta?.userId,
          source: it.source,
          sourceId: it.sourceId,
          id: it.id,
          sizeBytes: result.freedBytes,
          fileMissing: result.fileMissing
        },
        "[CompanyMediaDelete] item deleted"
      );
    } catch (err) {
      const reason =
        err instanceof Error ? err.message : String(err);
      failed.push({
        id: it.id,
        source: it.source,
        sourceId: it.sourceId,
        reason
      });
      logger.warn(
        {
          companyId,
          userId: logMeta?.userId,
          source: it.source,
          sourceId: it.sourceId,
          id: it.id,
          reason
        },
        "[CompanyMediaDelete] item failed"
      );
    }
  }

  if (totalFreed > 0) {
    await decrementCompanyStorageUsage(companyId, totalFreed);
    logger.info(
      {
        companyId,
        userId: logMeta?.userId,
        freedBytes: totalFreed,
        deletedCount: deleted.length
      },
      "[CompanyMediaDelete] storage updated"
    );
  }

  return {
    deletedCount: deleted.length,
    failedCount: failed.length,
    freedBytes: totalFreed,
    freedFormatted: formatBytesPtBr(totalFreed),
    deleted,
    failed
  };
};

export default BatchDeleteCompanyMediaService;
