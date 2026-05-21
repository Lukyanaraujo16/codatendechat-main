import { logger } from "../utils/logger";
import { tableExists } from "./tableExists";
import { isMissingRelationError } from "./optionalTableQuery";
import AppError from "../errors/AppError";

export const CONTACT_LABEL_RELATIONS_TABLE = "ContactLabelRelations";

export async function isContactLabelRelationsTableAvailable(): Promise<boolean> {
  return tableExists(CONTACT_LABEL_RELATIONS_TABLE);
}

export function assertContactLabelRelationsTable(): void {
  throw new AppError(
    "ERR_CONTACT_LABEL_RELATIONS_TABLE_MISSING",
    503,
    "Tabela de associação de etiquetas não encontrada. Execute as migrations do backend."
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
