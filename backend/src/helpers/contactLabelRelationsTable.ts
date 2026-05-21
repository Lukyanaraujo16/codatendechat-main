import { Sequelize } from "sequelize";
import ContactLabelRelation from "../models/ContactLabelRelation";
import { logger } from "../utils/logger";

export const CONTACT_LABEL_RELATIONS_TABLE = "ContactLabelRelations";

export function getContactLabelRelationModel(
  sequelize: Sequelize
): typeof ContactLabelRelation {
  const model =
    (sequelize.models.ContactLabelRelation as typeof ContactLabelRelation) ||
    ContactLabelRelation;

  if (!model) {
    throw new Error("ContactLabelRelation model not registered");
  }

  return model;
}

/** Valida que o model está registado após addModels (não bloqueia por tabela). */
export function assertContactLabelRelationModelRegistered(
  sequelize: Sequelize
): void {
  getContactLabelRelationModel(sequelize);
}

/** Log do nome físico que o Sequelize usa (startup). */
export function logContactLabelRelationModelTable(sequelize: Sequelize): void {
  const model = getContactLabelRelationModel(sequelize);
  let tableName: string = CONTACT_LABEL_RELATIONS_TABLE;
  if (typeof model.getTableName === "function") {
    const raw = model.getTableName();
    tableName =
      typeof raw === "string"
        ? raw
        : (raw as { tableName?: string }).tableName || tableName;
  }

  logger.info({ tableName }, "[ContactLabels] model table name");
  // eslint-disable-next-line no-console
  console.log(tableName);
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
    stack
  });
}
