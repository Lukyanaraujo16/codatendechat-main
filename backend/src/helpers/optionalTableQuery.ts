import { logger } from "../utils/logger";
import { tableExists } from "./tableExists";

export const CHAT_MESSAGES_TABLE = "ChatMessages";

export function isMissingRelationError(err: unknown, tableHint?: string): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  if (!lower.includes("does not exist") && !lower.includes("no such table")) {
    return false;
  }
  if (!tableHint) return true;
  const hint = tableHint.toLowerCase();
  return lower.includes(hint) || lower.includes(`relation "${hint}"`);
}

/** Regista aviso único para resposta batch (não exposto como erro ao utilizador). */
export function noteOptionalTableSkipped(
  warnings: string[] | undefined,
  tableName: string
): void {
  if (!warnings) return;
  const label = `${tableName} table skipped`;
  if (!warnings.includes(label)) {
    warnings.push(label);
  }
}

export async function isChatMessagesTableAvailable(
  warnings?: string[]
): Promise<boolean> {
  const exists = await tableExists(CHAT_MESSAGES_TABLE);
  if (!exists) {
    logger.warn(
      { table: CHAT_MESSAGES_TABLE },
      "[CompanyMediaDelete] skipped missing table ChatMessages"
    );
    noteOptionalTableSkipped(warnings, "chatmessages");
  }
  return exists;
}
