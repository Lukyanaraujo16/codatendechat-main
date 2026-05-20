import fs from "fs";
import path from "path";
import { Op } from "sequelize";
import { normalizePublicRelPath } from "./companyMediaTypes";
import { resolvePublicMediaStat } from "./resolvePublicMediaStat";
import { getBackendPublicFolder } from "./publicFolder";
import { tryStatFileBytes } from "../services/CompanyService/adjustCompanyStorageUsage";

/** Variantes de path para corresponder ao valor guardado na BD (URL, /public/, basename). */
export function collectPathMatchVariants(
  relRaw: string | null | undefined
): string[] {
  if (relRaw == null) return [];
  const raw = String(relRaw).trim();
  if (!raw) return [];
  const out = new Set<string>();
  out.add(raw);
  const norm = normalizePublicRelPath(raw);
  if (norm) out.add(norm);
  const base = path.basename(raw.replace(/\\/g, "/"));
  if (base && base !== "." && base !== raw) out.add(base);
  if (norm && norm !== raw) {
    const baseNorm = path.basename(norm);
    if (baseNorm && baseNorm !== norm) out.add(baseNorm);
  }
  return [...out];
}

export function pathsReferToSameFile(
  stored: string | null | undefined,
  relRaw: string | null | undefined
): boolean {
  if (!stored || !relRaw) return false;
  const a = collectPathMatchVariants(stored);
  const b = collectPathMatchVariants(relRaw);
  return a.some((x) => b.includes(x));
}

export function buildMediaUrlWhere(variants: string[]) {
  if (!variants.length) return null;
  return { [Op.or]: variants.map((v) => ({ mediaUrl: v })) };
}

export function buildMediaPathWhere(variants: string[]) {
  if (!variants.length) return null;
  return { [Op.or]: variants.map((v) => ({ mediaPath: v })) };
}

/**
 * Remove ficheiro em public/ com resolução segura (sem path traversal).
 * Devolve bytes libertados (0 se ficheiro já não existir).
 */
export function unlinkPublicMediaFile(
  relRaw: string | null | undefined,
  joinedRel?: string | null
): number {
  const publicFolder = path.resolve(getBackendPublicFolder());
  const stat = resolvePublicMediaStat(relRaw, joinedRel);
  if (!stat.absPath) return 0;

  const abs = path.resolve(stat.absPath);
  if (!abs.startsWith(publicFolder + path.sep) && abs !== publicFolder) {
    return 0;
  }
  if (!fs.existsSync(abs)) return 0;

  const sz = tryStatFileBytes(abs);
  try {
    fs.unlinkSync(abs);
  } catch {
    return 0;
  }
  return sz;
}
