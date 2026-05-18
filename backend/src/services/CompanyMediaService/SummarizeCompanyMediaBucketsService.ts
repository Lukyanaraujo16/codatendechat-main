import { calculateCompanyMediaTotalBytes } from "./ListCompanyMediaService";
import { EMPTY_COMPANY_MEDIA_SUMMARY } from "./companyMediaSummaryConstants";

export { EMPTY_COMPANY_MEDIA_SUMMARY };

/** Resumo por tipo — mesma fonte que a listagem e o recálculo de armazenamento. */
const SummarizeCompanyMediaBucketsService = async (
  companyId: number
): Promise<typeof EMPTY_COMPANY_MEDIA_SUMMARY> => {
  try {
    const totals = await calculateCompanyMediaTotalBytes(companyId);
    return {
      totalBytes: totals.totalBytes,
      imageBytes: totals.imageBytes,
      videoBytes: totals.videoBytes,
      audioBytes: totals.audioBytes,
      documentBytes: totals.documentBytes,
      otherBytes: totals.otherBytes
    };
  } catch {
    return { ...EMPTY_COMPANY_MEDIA_SUMMARY };
  }
};

export default SummarizeCompanyMediaBucketsService;
