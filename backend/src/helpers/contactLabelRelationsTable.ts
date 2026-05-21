import { logger } from "../utils/logger";
import {
  clearTableExistsCache,
  findTablesMatching,
  tableExists,
  tableExistsAny
} from "./tableExists";
import { isMissingRelationError } from "./optionalTableQuery";
import AppError from "../errors/AppError";

/** Nome canónico — alinhado com model e migration. */
export const CONTACT_LABEL_RELATIONS_TABLE = "ContactLabelRelations";

const CONTACT_LABEL_RELATIONS_ALIASES = [
  CONTACT_LABEL_RELATIONS_TABLE,
  "contact_label_relations",
  "contactlabelrelations",
  "ContactLabelRelation"
];

let resolvedTableName: string | null | undefined;

function normalizeTableKey(name: string): string {
  return name.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

/**
 * Resolve o nome real da tabela no banco (cache por processo).
 */
export async function getContactLabelRelationsTableName(
  options: { refresh?: boolean } = {}
): Promise<string | null> {
  if (!options.refresh && resolvedTableName !== undefined) {
    return resolvedTableName;
  }

  if (options.refresh) {
    clearTableExistsCache();
    resolvedTableName = undefined;
  }

  const direct = await tableExistsAny(CONTACT_LABEL_RELATIONS_ALIASES, {
    skipCache: true
  });
  if (direct) {
    resolvedTableName = direct;
    if (direct !== CONTACT_LABEL_RELATIONS_TABLE) {
      logger.warn(
        { found: direct, expected: CONTACT_LABEL_RELATIONS_TABLE },
        "[ContactLabels] relations table name differs from model — run ensure migration"
      );
    }
    return resolvedTableName;
  }

  const patternMatches = await findTablesMatching("%contact%label%rel%");
  if (patternMatches.length === 1) {
    resolvedTableName = patternMatches[0];
    logger.info(
      { table: resolvedTableName },
      "[ContactLabels] relations table resolved via information_schema"
    );
    return resolvedTableName;
  }

  if (patternMatches.length > 1) {
    const canonical = patternMatches.find(
      (t) => normalizeTableKey(t) === normalizeTableKey(CONTACT_LABEL_RELATIONS_TABLE)
    );
    resolvedTableName = canonical || patternMatches[0];
    logger.warn(
      { matches: patternMatches, using: resolvedTableName },
      "[ContactLabels] multiple contact label relation tables found"
    );
    return resolvedTableName;
  }

  resolvedTableName = null;
  return null;
}

export async function isContactLabelRelationsTableAvailable(
  options?: { refresh?: boolean }
): Promise<boolean> {
  const name = await getContactLabelRelationsTableName(options);
  if (!name) return false;
  return (
    normalizeTableKey(name) === normalizeTableKey(CONTACT_LABEL_RELATIONS_TABLE)
  );
}

export function assertContactLabelRelationsTable(): void {
  throw new AppError(
    "ERR_CONTACT_LABEL_RELATIONS_TABLE_MISSING",
    503,
    "Tabela ContactLabelRelations não encontrada. Execute: npm run build && npm run db:migrate"
  );
}

export function logContactLabelRelationsDbError(
  operation: string,
  context: Record<string, unknown>,
  err: unknown
): void {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  logger.error({
    msg: `[ContactLabels] ${operation} failed`,
    ...context,
    error: message,
    stack,
    missingTable: isMissingRelationError(err, CONTACT_LABEL_RELATIONS_TABLE)
  });
}
