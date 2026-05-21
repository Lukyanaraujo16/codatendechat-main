import { QueryTypes } from "sequelize";
import sequelize from "../database";

const existenceCache = new Map<string, boolean>();

function cacheKey(tableName: string, schemasKey: string): string {
  return `${schemasKey}::${tableName.trim().toLowerCase()}`;
}

function parseExistsValue(value: unknown): boolean {
  if (value === true || value === 1 || value === "1") return true;
  if (value === false || value === 0 || value === "0") return false;
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (lower === "t" || lower === "true") return true;
    if (lower === "f" || lower === "false") return false;
  }
  return Boolean(value);
}

export type TableExistsOptions = {
  skipCache?: boolean;
  noNegativeCache?: boolean;
};

export type TableRow = {
  table_schema: string;
  table_name: string;
};

/** Schemas onde procurar tabelas (Postgres: public + current_schema). */
export async function getPostgresSearchSchemas(): Promise<string[]> {
  try {
    const rows = (await sequelize.query<{ current_schema: string }>(
      `SELECT current_schema() AS current_schema`,
      { type: QueryTypes.SELECT }
    )) as { current_schema: string }[];
    const current = rows[0]?.current_schema || "public";
    return [...new Set(["public", current])];
  } catch {
    return ["public"];
  }
}

function normalizeTableKey(name: string): string {
  return name.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

/**
 * Lista tabelas (schema + nome) por padrão ILIKE/LIKE em todos os schemas relevantes.
 */
export async function findTablesWithSchemas(
  pattern: string
): Promise<TableRow[]> {
  const dialect = sequelize.getDialect();
  const likePattern = pattern.replace(/\*/g, "%");

  try {
    if (dialect === "postgres") {
      const schemas = await getPostgresSearchSchemas();

      let rows = (await sequelize.query<TableRow>(
        `SELECT table_schema, table_name
         FROM information_schema.tables
         WHERE table_schema = ANY(:schemas)
           AND table_type = 'BASE TABLE'
           AND table_name ILIKE :pattern
         ORDER BY table_schema, table_name`,
        {
          replacements: { schemas, pattern: likePattern },
          type: QueryTypes.SELECT
        }
      )) as TableRow[];

      if (rows.length > 0) return rows;

      rows = (await sequelize.query<TableRow>(
        `SELECT table_schema, table_name
         FROM information_schema.tables
         WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
           AND table_type = 'BASE TABLE'
           AND table_name ILIKE :pattern
         ORDER BY table_schema, table_name`,
        {
          replacements: { pattern: likePattern },
          type: QueryTypes.SELECT
        }
      )) as TableRow[];

      return rows;
    }

    if (dialect === "mysql" || dialect === "mariadb") {
      const rows = (await sequelize.query<TableRow>(
        `SELECT table_schema, table_name
         FROM information_schema.tables
         WHERE table_schema = DATABASE()
           AND table_name LIKE :pattern
         ORDER BY table_name`,
        {
          replacements: { pattern: likePattern },
          type: QueryTypes.SELECT
        }
      )) as TableRow[];
      return rows;
    }

    const rows = (await sequelize.query<{ name: string }>(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name LIKE :pattern COLLATE NOCASE`,
      {
        replacements: { pattern: likePattern },
        type: QueryTypes.SELECT
      }
    )) as { name: string }[];
    return rows.map((r) => ({ table_schema: "main", table_name: r.name }));
  } catch {
    return [];
  }
}

export async function findTablesMatching(pattern: string): Promise<string[]> {
  const rows = await findTablesWithSchemas(pattern);
  return rows.map((r) => r.table_name);
}

export async function tableExists(
  tableName: string,
  options: TableExistsOptions = {}
): Promise<boolean> {
  const { skipCache = false, noNegativeCache = true } = options;
  const dialect = sequelize.getDialect();
  const schemasKey =
    dialect === "postgres"
      ? (await getPostgresSearchSchemas()).join(",")
      : dialect;
  const key = cacheKey(tableName, schemasKey);

  if (!skipCache && existenceCache.has(key)) {
    return existenceCache.get(key)!;
  }

  const rows = await findTablesWithSchemas(tableName);
  const target = normalizeTableKey(tableName);
  const exists = rows.some((r) => normalizeTableKey(r.table_name) === target);

  if (exists || !noNegativeCache) {
    existenceCache.set(key, exists);
  }

  return exists;
}

export async function tableExistsAny(
  names: string[],
  options?: TableExistsOptions
): Promise<string | null> {
  const all = await findTablesWithSchemas("%");
  const keys = new Set(names.map(normalizeTableKey));

  for (const row of all) {
    if (keys.has(normalizeTableKey(row.table_name))) {
      return row.table_name;
    }
  }

  for (const name of names) {
    if (await tableExists(name, { ...options, skipCache: true })) {
      return name;
    }
  }

  return null;
}

export function clearTableExistsCache(): void {
  existenceCache.clear();
}
