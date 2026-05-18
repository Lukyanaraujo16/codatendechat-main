import fs from "fs";
import path from "path";
import { QueryTypes } from "sequelize";
import sequelize from "../database";
import Files from "../models/Files";
import FilesOptions from "../models/FilesOptions";
import { FlowImgModel } from "../models/FlowImg";
import { FlowAudioModel } from "../models/FlowAudio";
import { getBackendPublicFolder } from "./publicFolder";
import { normalizePublicRelPath } from "./companyMediaTypes";
import { logger } from "../utils/logger";

export type CompanyStorageSourceStat = {
  count: number;
  bytes: number;
};

export type CompanyStorageScanResult = {
  totalBytes: number;
  bySource: Record<string, CompanyStorageSourceStat>;
};

function safeFileSize(absPath: string): number {
  try {
    const st = fs.statSync(absPath);
    return st.isFile() ? st.size : 0;
  } catch {
    return 0;
  }
}

/**
 * Percorre todas as origens de mídia em `public/` da empresa (mesma cobertura da Gestão de mídias).
 */
export async function scanCompanyPublicMediaBytes(
  companyId: number
): Promise<CompanyStorageScanResult> {
  const publicFolder = getBackendPublicFolder();
  const seen = new Set<string>();
  const bySource: Record<string, CompanyStorageSourceStat> = {};
  let totalBytes = 0;

  const bump = (source: string, bytes: number) => {
    if (!bySource[source]) {
      bySource[source] = { count: 0, bytes: 0 };
    }
    bySource[source].count += 1;
    bySource[source].bytes += bytes;
    totalBytes += bytes;
  };

  const addPath = (raw: string | null | undefined, source: string) => {
    const norm =
      normalizePublicRelPath(raw) ||
      (() => {
        const s = String(raw || "")
          .trim()
          .replace(/\\/g, "/")
          .replace(/^\/+/, "");
        if (!s || s.startsWith("http://") || s.startsWith("https://")) return null;
        return s;
      })();
    if (!norm) return;
    const abs = path.isAbsolute(norm) ? norm : path.join(publicFolder, norm);
    const fp = path.normalize(abs);
    if (seen.has(fp)) return;
    seen.add(fp);
    const sz = safeFileSize(fp);
    if (sz <= 0) return;
    bump(source, sz);
  };

  const runDistinct = async (sql: string) => {
    try {
      return await sequelize.query(sql, {
        replacements: { cid: companyId },
        type: QueryTypes.SELECT
      });
    } catch (err) {
      logger.warn(
        {
          companyId,
          err: err instanceof Error ? err.message : String(err)
        },
        "[CompanyStorage] source query failed"
      );
      return [];
    }
  };

  logger.info({ companyId }, "[CompanyStorage] calculate start");

  const msgRows = (await runDistinct(`
    SELECT DISTINCT mediaUrl AS mediaUrl FROM Messages
    WHERE companyId = :cid AND mediaUrl IS NOT NULL AND mediaUrl != ''
  `)) as { mediaUrl?: string }[];
  for (const row of msgRows) {
    addPath(row.mediaUrl, "messages");
  }

  const quickRows = (await runDistinct(`
    SELECT DISTINCT mediaPath AS mediaPath FROM QuickMessages
    WHERE companyId = :cid AND mediaPath IS NOT NULL AND mediaPath != ''
  `)) as { mediaPath?: string }[];
  for (const row of quickRows) {
    if (row.mediaPath) {
      addPath(path.join("quickMessage", row.mediaPath), "quickMessages");
    }
  }

  const schedRows = (await runDistinct(`
    SELECT DISTINCT mediaPath AS mediaPath FROM Schedules
    WHERE companyId = :cid AND mediaPath IS NOT NULL AND mediaPath != ''
  `)) as { mediaPath?: string }[];
  for (const row of schedRows) {
    addPath(row.mediaPath, "schedules");
  }

  const campRows = (await runDistinct(`
    SELECT DISTINCT mediaPath AS mediaPath FROM Campaigns
    WHERE companyId = :cid AND mediaPath IS NOT NULL AND mediaPath != ''
  `)) as { mediaPath?: string }[];
  for (const row of campRows) {
    addPath(row.mediaPath, "campaigns");
  }

  const annRows = (await runDistinct(`
    SELECT DISTINCT mediaPath AS mediaPath FROM Announcements
    WHERE companyId = :cid AND mediaPath IS NOT NULL AND mediaPath != ''
  `)) as { mediaPath?: string }[];
  for (const row of annRows) {
    addPath(row.mediaPath, "announcements");
  }

  try {
    const fileLists = await Files.findAll({
      where: { companyId },
      include: [{ model: FilesOptions, as: "options", required: false }]
    });
    for (const fl of fileLists) {
      const opts = fl.options;
      if (!opts?.length) continue;
      for (const opt of opts) {
        if (opt.path) {
          addPath(
            path.join("fileList", String(fl.id), opt.path),
            "fileListOptions"
          );
        }
      }
    }
  } catch (err) {
    logger.warn(
      {
        companyId,
        err: err instanceof Error ? err.message : String(err)
      },
      "[CompanyStorage] file lists failed"
    );
  }

  const chatRows = (await runDistinct(`
    SELECT DISTINCT cm.mediaPath AS mediaPath
    FROM ChatMessages cm
    INNER JOIN Chats c ON c.id = cm.chatId
    WHERE c.companyId = :cid
      AND cm.mediaPath IS NOT NULL
      AND cm.mediaPath != ''
  `)) as { mediaPath: string }[];
  for (const row of chatRows) {
    addPath(row.mediaPath, "chatMessages");
  }

  try {
    const flowImgRows = await FlowImgModel.findAll({
      where: { companyId },
      attributes: ["name"],
      raw: true
    });
    for (const row of flowImgRows as { name?: string }[]) {
      if (row.name) addPath(row.name, "flowImages");
    }
  } catch (err) {
    logger.warn(
      {
        companyId,
        err: err instanceof Error ? err.message : String(err)
      },
      "[CompanyStorage] flow images failed"
    );
  }

  try {
    const flowAudioRows = await FlowAudioModel.findAll({
      where: { companyId },
      attributes: ["name"],
      raw: true
    });
    for (const row of flowAudioRows as { name?: string }[]) {
      if (row.name) addPath(row.name, "flowAudio");
    }
  } catch (err) {
    logger.warn(
      {
        companyId,
        err: err instanceof Error ? err.message : String(err)
      },
      "[CompanyStorage] flow audio failed"
    );
  }

  const total = Math.round(totalBytes);
  for (const [source, stat] of Object.entries(bySource)) {
    logger.info(
      {
        companyId,
        source,
        count: stat.count,
        bytes: Math.round(stat.bytes)
      },
      "[CompanyStorage] source total"
    );
  }

  logger.info(
    { companyId, totalBytes: total, sources: Object.keys(bySource) },
    "[CompanyStorage] calculate success"
  );

  return { totalBytes: total, bySource };
}
