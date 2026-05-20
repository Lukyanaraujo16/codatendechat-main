import path from "path";
import { QueryTypes } from "sequelize";
import sequelize from "../../database";
import Message from "../../models/Message";
import QuickMessage from "../../models/QuickMessage";
import Schedule from "../../models/Schedule";
import Campaign from "../../models/Campaign";
import Announcement from "../../models/Announcement";
import Files from "../../models/Files";
import FilesOptions from "../../models/FilesOptions";
import { FlowImgModel } from "../../models/FlowImg";
import { FlowAudioModel } from "../../models/FlowAudio";
import { normalizePublicRelPath } from "../../helpers/companyMediaTypes";
import {
  buildMediaPathWhere,
  buildMediaUrlWhere,
  collectPathMatchVariants,
  pathsReferToSameFile
} from "../../helpers/companyMediaDeletePath";

/**
 * Conta quantos registos apontam para o mesmo ficheiro relativo em `public/`.
 * Usa variantes de path (URL absoluta, /public/, basename) — alinhado à listagem.
 */
export async function countAllReferencesToRelPath(
  companyId: number,
  relRaw: string | null | undefined
): Promise<number> {
  const variants = collectPathMatchVariants(relRaw);
  const r = normalizePublicRelPath(relRaw);
  if (!variants.length && !r) return 0;

  let n = 0;

  const msgWhere = buildMediaUrlWhere(variants);
  if (msgWhere) {
    n += await Message.count({
      where: { companyId, ...msgWhere }
    });
  }

  if (r?.startsWith("quickMessage/")) {
    const inner = r.slice("quickMessage/".length);
    const innerVariants = collectPathMatchVariants(inner);
    const qmWhere = buildMediaPathWhere(innerVariants);
    if (qmWhere) {
      n += await QuickMessage.count({
        where: { companyId, ...qmWhere }
      });
    }
  }

  const pathWhere = buildMediaPathWhere(variants);
  if (pathWhere) {
    n += await Schedule.count({ where: { companyId, ...pathWhere } });
    n += await Campaign.count({ where: { companyId, ...pathWhere } });
    n += await Announcement.count({ where: { companyId, ...pathWhere } });
  }

  const chatRows = await sequelize.query<{ mediaPath: string }>(
    `
    SELECT cm.mediaPath AS "mediaPath"
    FROM ChatMessages cm
    INNER JOIN Chats c ON c.id = cm.chatId
    WHERE c.companyId = :cid
      AND cm.mediaPath IS NOT NULL
      AND cm.mediaPath != ''
    `,
    { replacements: { cid: companyId }, type: QueryTypes.SELECT }
  );
  for (const row of chatRows) {
    if (pathsReferToSameFile(row.mediaPath, relRaw)) n += 1;
  }

  const m = /^fileList\/(\d+)\/(.+)$/.exec(r || "");
  if (m) {
    const fileId = Number(m[1]);
    const pth = m[2];
    if (Number.isFinite(fileId) && pth) {
      n += await FilesOptions.count({
        where: { path: pth },
        include: [{ model: Files, where: { companyId, id: fileId }, required: true }]
      });
    }
  }

  if (r) {
    n += await FlowImgModel.count({ where: { companyId, name: r } });
    n += await FlowAudioModel.count({ where: { companyId, name: r } });
  }

  return n;
}
