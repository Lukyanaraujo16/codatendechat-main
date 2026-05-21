import { QueryTypes } from "sequelize";
import sequelize from "../database";

const existenceCache = new Map<string, boolean>();

function cacheKey(tableName: string): string {
  return tableName.trim().toLowerCase();
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
  /** Ignora cache (útil após migrations). */
  skipCache?: boolean;
  /** Não guardar resultado negativo em cache. */
  noNegativeCache?: boolean;
};

/**
 * Verifica se uma tabela existe no schema atual.
 * Resultados negativos não ficam em cache por defeito (evita falso "missing" após migrate).
 */
export async function tableExists(
  tableName: string,
  options: TableExistsOptions = {}
): Promise<boolean> {
  const { skipCache = false, noNegativeCache = true } = options;
  const key = cacheKey(tableName);

  if (!skipCache && existenceCache.has(key)) {
    return existenceCache.get(key)!;
  }

  const dialect = sequelize.getDialect();
  let exists = false;

  try {
    if (dialect === "postgres") {
      const rows = (await sequelize.query<{ exists: unknown }>(
        `SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = current_schema()
            AND table_name ILIKE :name
        ) AS "exists"`,
        {
          replacements: { name: tableName },
          type: QueryTypes.SELECT
        }
      )) as { exists: unknown }[];
      exists = parseExistsValue(rows[0]?.exists);
    } else if (dialect === "mysql" || dialect === "mariadb") {
      const rows = (await sequelize.query<{ cnt: number }>(
        `SELECT COUNT(*) AS cnt
         FROM information_schema.tables
         WHERE table_schema = DATABASE()
           AND LOWER(table_name) = LOWER(:name)`,
        {
          replacements: { name: tableName },
          type: QueryTypes.SELECT
        }
      )) as { cnt: number }[];
      exists = Number(rows[0]?.cnt) > 0;
    } else {
      const rows = (await sequelize.query<{ name: string }>(
        `SELECT name FROM sqlite_master
         WHERE type = 'table' AND name = :name COLLATE NOCASE`,
        {
          replacements: { name: tableName },
          type: QueryTypes.SELECT
        }
      )) as { name: string }[];
      exists = rows.length > 0;
    }
  } catch {
    exists = false;
  }

  if (exists || !noNegativeCache) {
    existenceCache.set(key, exists);
  }

  return exists;
}

/**
 * Lista nomes reais de tabelas que correspondem ao padrão (ILIKE / LIKE).
 */
export async function findTablesMatching(pattern: string): Promise<string[]> {
  const dialect = sequelize.getDialect();
  const likePattern = pattern.replace(/\*/g, "%");

  try {
    if (dialect === "postgres") {
      const rows = (await sequelize.query<{ table_name: string }>(
        `SELECT table_name
         FROM information_schema.tables
         WHERE table_schema = current_schema()
           AND table_type = 'BASE TABLE'
           AND table_name ILIKE :pattern
         ORDER BY table_name`,
        {
          replacements: { pattern: likePattern },
          type: QueryTypes.SELECT
        }
      )) as { table_name: string }[];
      return rows.map((r) => r.table_name);
    }

    if (dialect === "mysql" || dialect === "mariadb") {
      const rows = (await sequelize.query<{ table_name: string }>(
        `SELECT table_name
         FROM information_schema.tables
         WHERE table_schema = DATABASE()
           AND table_name LIKE :pattern
         ORDER BY table_name`,
        {
          replacements: { pattern: likePattern },
          type: QueryTypes.SELECT
        }
      )) as { table_name: string }[];
      return rows.map((r) => r.table_name);
    }

    const rows = (await sequelize.query<{ name: string }>(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name LIKE :pattern COLLATE NOCASE`,
      {
        replacements: { pattern: likePattern },
        type: QueryTypes.SELECT
      }
    )) as { name: string }[];
    return rows.map((r) => r.name);
  } catch {
    return [];
  }
}

/** Verifica se algum dos nomes candidatos existe. */
export async function tableExistsAny(
  names: string[],
  options?: TableExistsOptions
): Promise<string | null> {
  for (const name of names) {
    if (await tableExists(name, { ...options, skipCache: true })) {
      return name;
    }
  }
  return null;
}

/** Limpa cache (útil em testes ou após migrations). */
export function clearTableExistsCache(): void {
  existenceCache.clear();
}
