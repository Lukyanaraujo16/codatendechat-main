import fs from "fs";
import path from "path";
import { getBackendPublicFolder } from "./publicFolder";
import { normalizePublicRelPath } from "./companyMediaTypes";

export type PublicMediaStatResult = {
  sizeBytes: number;
  missing: boolean;
  storageRel: string | null;
  absPath: string | null;
};

/**
 * Resolve caminho em public/ e stat — mesma lógica usada na Gestão de mídias (listagem).
 * Tenta path normalizado, path “joined” e basename (WhatsApp grava só o filename).
 */
export function resolvePublicMediaStat(
  relRaw: string | null | undefined,
  joinedRel?: string | null
): PublicMediaStatResult {
  const publicFolder = getBackendPublicFolder();
  const candidates: string[] = [];

  const norm = normalizePublicRelPath(relRaw);
  if (norm) candidates.push(norm);

  if (joinedRel) {
    const j = String(joinedRel).trim().replace(/\\/g, "/").replace(/^\/+/, "");
    if (j && !j.startsWith("http://") && !j.startsWith("https://")) {
      candidates.push(j);
    }
  }

  if (relRaw) {
    const base = path.basename(String(relRaw).replace(/\\/g, "/"));
    if (base && base !== "." && !candidates.includes(base)) {
      candidates.push(base);
    }
  }

  for (const rel of candidates) {
    const abs = path.normalize(path.join(publicFolder, rel));
    try {
      const st = fs.statSync(abs);
      if (st.isFile()) {
        return {
          sizeBytes: st.size,
          missing: false,
          storageRel: rel,
          absPath: abs
        };
      }
    } catch {
      /* tenta próximo candidato */
    }
  }

  return {
    sizeBytes: 0,
    missing: Boolean(norm || joinedRel),
    storageRel: norm || joinedRel || null,
    absPath: null
  };
}
