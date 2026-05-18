import Company from "../../models/Company";
import Plan from "../../models/Plan";
import AppError from "../../errors/AppError";
import {
  computeStorageUsagePercent,
  formatBytesPtBr,
  getCompanyStorageLimitBytes,
  resolveStorageAlertLevel
} from "../../helpers/companyStorage";
import { calculateCompanyMediaTotalBytes } from "../CompanyMediaService/ListCompanyMediaService";
import RecalculateCompanyStorageUsageService from "./RecalculateCompanyStorageUsageService";
import { logger } from "../../utils/logger";

/** Recálculo automático se nunca calculou ou se passou mais de 24h. */
const STALE_STORAGE_MS = 24 * 60 * 60 * 1000;

export type TenantStorageResponse = {
  usedBytes: number;
  limitBytes: number | null;
  usedFormatted: string;
  limitFormatted: string | null;
  remainingFormatted: string | null;
  percent: number | null;
  calculatedAt: string | null;
  alertLevel: ReturnType<typeof resolveStorageAlertLevel>;
  /** true quando o valor exibido veio do scan em disco (summary) por divergência com o DB. */
  usedFromLiveSummary?: boolean;
};

function buildResponse(
  row: Record<string, unknown>,
  plan: { storageLimitGb?: unknown } | undefined,
  usedBytes: number,
  options?: { usedFromLiveSummary?: boolean }
): TenantStorageResponse {
  const limitBytes = getCompanyStorageLimitBytes(
    { storageLimitGb: row.storageLimitGb },
    plan || null
  );
  const percent = computeStorageUsagePercent(usedBytes, limitBytes);
  const remaining =
    limitBytes !== null ? Math.max(0, limitBytes - usedBytes) : null;

  return {
    usedBytes,
    limitBytes,
    usedFormatted: formatBytesPtBr(usedBytes),
    limitFormatted: limitBytes !== null ? formatBytesPtBr(limitBytes) : null,
    remainingFormatted:
      remaining !== null ? formatBytesPtBr(remaining) : null,
    percent,
    calculatedAt: row.storageCalculatedAt
      ? new Date(String(row.storageCalculatedAt)).toISOString()
      : null,
    alertLevel: resolveStorageAlertLevel(percent),
    usedFromLiveSummary: options?.usedFromLiveSummary === true
  };
}

const GetMyCompanyStorageService = async (
  companyId: number
): Promise<TenantStorageResponse> => {
  let company = await Company.findByPk(companyId, {
    attributes: [
      "id",
      "storageUsedBytes",
      "storageLimitGb",
      "storageCalculatedAt"
    ],
    include: [
      {
        model: Plan,
        as: "plan",
        attributes: ["id", "storageLimitGb"],
        required: false
      }
    ]
  });

  if (!company) {
    throw new AppError("ERR_NO_COMPANY_FOUND", 404);
  }

  let row = company.toJSON() as Record<string, unknown>;
  const calculatedAtRaw = row.storageCalculatedAt;
  const neverCalculated = calculatedAtRaw == null;
  const stale =
    calculatedAtRaw != null &&
    Date.now() - new Date(String(calculatedAtRaw)).getTime() > STALE_STORAGE_MS;

  if (neverCalculated || stale) {
    try {
      await RecalculateCompanyStorageUsageService(companyId, {
        snapshotReason: neverCalculated ? "auto_on_read" : "scheduled_recalculate"
      });
      company = await Company.findByPk(companyId, {
        attributes: [
          "id",
          "storageUsedBytes",
          "storageLimitGb",
          "storageCalculatedAt"
        ],
        include: [
          {
            model: Plan,
            as: "plan",
            attributes: ["id", "storageLimitGb"],
            required: false
          }
        ]
      });
      if (company) {
        row = company.toJSON() as Record<string, unknown>;
      }
    } catch (err) {
      logger.warn(
        {
          companyId,
          neverCalculated,
          stale,
          err: err instanceof Error ? err.message : String(err)
        },
        "[CompanyStorage] auto recalculate on read failed"
      );
    }
  }

  const plan = row.plan as { storageLimitGb?: unknown } | undefined;
  let usedBytes = Number(row.storageUsedBytes ?? 0);
  if (!Number.isFinite(usedBytes) || usedBytes < 0) {
    usedBytes = 0;
  }

  if (usedBytes === 0) {
    try {
      const inventory = await calculateCompanyMediaTotalBytes(companyId);
      if (inventory.totalBytes > 0) {
        logger.warn(
          {
            companyId,
            dbUsedBytes: usedBytes,
            summaryTotalBytes: inventory.totalBytes
          },
          "[CompanyStorage] db zero but inventory positive — using inventory for display"
        );
        usedBytes = inventory.totalBytes;
        void RecalculateCompanyStorageUsageService(companyId, {
          snapshotReason: "auto_on_read"
        }).catch((syncErr) => {
          logger.warn(
            {
              companyId,
              err: syncErr instanceof Error ? syncErr.message : String(syncErr)
            },
            "[CompanyStorage] background sync after summary mismatch failed"
          );
        });
        return buildResponse(row, plan, usedBytes, { usedFromLiveSummary: true });
      }
    } catch (err) {
      logger.warn(
        {
          companyId,
          err: err instanceof Error ? err.message : String(err)
        },
        "[CompanyStorage] summary fallback failed"
      );
    }
  }

  return buildResponse(row, plan, usedBytes);
};

export default GetMyCompanyStorageService;
