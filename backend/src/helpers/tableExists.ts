import { QueryTypes } from "sequelize";
import sequelize from "../database";

const existenceCache = new Map<string, boolean>();

function cacheKey(tableName: string): string {
  return tableName.trim().toLowerCase();
}

/**
 * Verifica se uma tabela existe no schema atual (cache em memória por processo).
 */
export async function tableExists(tableName: string): Promise<boolean> {
  const key = cacheKey(tableName);
  if (existenceCache.has(key)) {
    return existenceCache.get(key)!;
  }

  const dialect = sequelize.getDialect();
  let exists = false;

  try {
    if (dialect === "postgres") {
      const rows = (await sequelize.query<{ exists: boolean }>(
        `SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND lower(table_name) = lower(:name)
        ) AS "exists"`,
        {
          replacements: { name: tableName },
          type: QueryTypes.SELECT
        }
      )) as { exists: boolean }[];
      exists = Boolean(rows[0]?.exists);
    } else if (dialect === "mysql" || dialect === "mariadb") {
      const rows = (await sequelize.query<{ cnt: number }>(
        `SELECT COUNT(*) AS cnt
         FROM information_schema.tables
         WHERE table_schema = DATABASE()
           AND lower(table_name) = lower(:name)`,
        {
          replacements: { name: tableName },
          type: QueryTypes.SELECT
        }
      )) as { cnt: number }[];
      exists = Number(rows[0]?.cnt) > 0;
    } else {
      const rows = (await sequelize.query<{ name: string }>(
        `SELECT name FROM sqlite_master
         WHERE type = 'table' AND lower(name) = lower(:name)`,
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

  existenceCache.set(key, exists);
  return exists;
}

/** Limpa cache (útil em testes). */
export function clearTableExistsCache(): void {
  existenceCache.clear();
}
