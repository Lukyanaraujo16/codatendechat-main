import { Sequelize } from "sequelize";
import ContactLabelRelation from "../models/ContactLabelRelation";
import { logger } from "../utils/logger";
import { assertSequelize } from "./assertSequelize";
import { getDbConnectionSnapshot } from "./dbConnectionInfo";
import {
  clearTableExistsCache,
  findTablesWithSchemas,
  tableExists
} from "./tableExists";
import { isMissingRelationError } from "./optionalTableQuery";
import AppError from "../errors/AppError";

export const CONTACT_LABEL_RELATIONS_TABLE = "ContactLabelRelations";

const RELATION_TABLE_PATTERN = "%contact%label%rel%";
const LABEL_TABLE_PATTERN = "%label%";

const CONTACT_LABEL_RELATIONS_ALIASES = [
  CONTACT_LABEL_RELATIONS_TABLE,
  "contact_label_relations",
  "contactlabelrelations",
  "ContactLabelRelation"
];

let resolvedTableName: string | null | undefined;
const warmupPromises = new WeakMap<Sequelize, Promise<string | null>>();

function normalizeTableKey(name: string): string {
  return name.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

/** Alinha o model Sequelize ao nome físico da tabela no banco. */
export function bindContactLabelRelationsTableName(physicalName: string): void {
  const model = ContactLabelRelation as typeof ContactLabelRelation & {
    tableName?: string;
    options?: { tableName?: string };
  };
  if (model.options) {
    model.options.tableName = physicalName;
  }
  model.tableName = physicalName;
}

function pickBestRelationTable(
  rows: { table_schema: string; table_name: string }[]
): string | null {
  if (!rows.length) return null;

  const canonicalKey = normalizeTableKey(CONTACT_LABEL_RELATIONS_TABLE);
  const exact = rows.find((r) => normalizeTableKey(r.table_name) === canonicalKey);
  if (exact) return exact.table_name;

  if (rows.length === 1) return rows[0].table_name;

  const preferPublic = rows.find((r) => r.table_schema === "public");
  return preferPublic?.table_name || rows[0].table_name;
}

export async function logContactLabelRelationsDiagnostics(
  sequelize: Sequelize,
  reason: string,
  extra: Record<string, unknown> = {}
): Promise<void> {
  const db = assertSequelize(sequelize, "logContactLabelRelationsDiagnostics");
  const snapshot = await getDbConnectionSnapshot(db);
  const relationTables = await findTablesWithSchemas(db, RELATION_TABLE_PATTERN);
  const labelTables = await findTablesWithSchemas(db, LABEL_TABLE_PATTERN);
  const resolved = await getContactLabelRelationsTableName(db, { refresh: true });
  const existsCanonical = await tableExists(db, CONTACT_LABEL_RELATIONS_TABLE, {
    skipCache: true
  });

  logger.error({
    msg: `[ContactLabels] ${reason}`,
    ...extra,
    db: snapshot,
    resolvedTableName: resolved,
    existsCanonical,
    relationTables,
    labelTables,
    modelTableName:
      (ContactLabelRelation as { tableName?: string }).tableName ||
      CONTACT_LABEL_RELATIONS_TABLE
  });
}

export async function getContactLabelRelationsTableName(
  sequelize: Sequelize,
  options: { refresh?: boolean } = {}
): Promise<string | null> {
  const db = assertSequelize(sequelize, "getContactLabelRelationsTableName");

  if (!options.refresh && resolvedTableName !== undefined) {
    return resolvedTableName;
  }

  if (options.refresh) {
    clearTableExistsCache();
    resolvedTableName = undefined;
  }

  const relationRows = await findTablesWithSchemas(db, RELATION_TABLE_PATTERN);
  const picked = pickBestRelationTable(relationRows);
  if (picked) {
    resolvedTableName = picked;
    bindContactLabelRelationsTableName(picked);
    if (normalizeTableKey(picked) !== normalizeTableKey(CONTACT_LABEL_RELATIONS_TABLE)) {
      logger.warn(
        { found: picked, expected: CONTACT_LABEL_RELATIONS_TABLE, schemas: relationRows },
        "[ContactLabels] using physical table name from database"
      );
    }
    return resolvedTableName;
  }

  for (const alias of CONTACT_LABEL_RELATIONS_ALIASES) {
    if (await tableExists(db, alias, { skipCache: true })) {
      resolvedTableName = alias;
      bindContactLabelRelationsTableName(alias);
      return resolvedTableName;
    }
  }

  resolvedTableName = null;
  return null;
}

export async function isContactLabelRelationsTableAvailable(
  sequelize: Sequelize,
  options?: { refresh?: boolean }
): Promise<boolean> {
  const name = await getContactLabelRelationsTableName(sequelize, options);
  return Boolean(name);
}

export async function warmupContactLabelRelationsTable(
  sequelize: Sequelize,
  options: { refresh?: boolean } = {}
): Promise<string | null> {
  const db = assertSequelize(sequelize, "warmupContactLabelRelationsTable");

  if (!options.refresh) {
    const cached = warmupPromises.get(db);
    if (cached) return cached;
  }

  const promise = (async () => {
    const name = await getContactLabelRelationsTableName(db, options);
    if (name) {
      logger.info(
        { table: name, modelTable: (ContactLabelRelation as { tableName?: string }).tableName },
        "[ContactLabels] relations table ready"
      );
    } else {
      await logContactLabelRelationsDiagnostics(db, "relations table not found at warmup");
    }
    return name;
  })();

  warmupPromises.set(db, promise);
  return promise;
}

export function assertContactLabelRelationsTable(): never {
  throw new AppError(
    "ERR_CONTACT_LABEL_RELATIONS_TABLE_MISSING",
    503,
    "Tabela ContactLabelRelations não encontrada. Execute: npm run build && npm run db:migrate"
  );
}

export async function ensureContactLabelRelationsReady(
  sequelize: Sequelize
): Promise<string> {
  const name = await warmupContactLabelRelationsTable(sequelize, { refresh: true });
  if (name) return name;

  await logContactLabelRelationsDiagnostics(sequelize, "TABLE_MISSING on apply");
  assertContactLabelRelationsTable();
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
