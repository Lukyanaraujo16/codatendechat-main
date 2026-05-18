import { calculateCompanyMediaTotalBytes } from "../services/CompanyMediaService/ListCompanyMediaService";

export type CompanyStorageSourceStat = {
  count: number;
  bytes: number;
};

export type CompanyStorageScanResult = {
  totalBytes: number;
  bySource: Record<string, CompanyStorageSourceStat>;
};

/** @deprecated Preferir calculateCompanyMediaTotalBytes — mantido para compatibilidade. */
export async function scanCompanyPublicMediaBytes(
  companyId: number
): Promise<CompanyStorageScanResult> {
  const totals = await calculateCompanyMediaTotalBytes(companyId);
  return {
    totalBytes: totals.totalBytes,
    bySource: totals.bySource
  };
}
