import { QueryTypes, Sequelize } from "sequelize";
import { logger } from "../utils/logger";
import { assertSequelize } from "./assertSequelize";

export type DbConnectionSnapshot = {
  dialect: string;
  database: string | null;
  host: string | null;
  port: number | null;
  username: string | null;
  schema: string | null;
  searchPath: string | null;
};

export async function getDbConnectionSnapshot(
  sequelize: Sequelize
): Promise<DbConnectionSnapshot> {
  const db = assertSequelize(sequelize, "getDbConnectionSnapshot");

  const cfg = db.config as unknown as {
    host?: string;
    port?: number | string;
    database?: string;
    username?: string;
  };

  const snapshot: DbConnectionSnapshot = {
    dialect: db.getDialect(),
    database: cfg.database ?? null,
    host: cfg.host ?? null,
    port: cfg.port != null ? Number(cfg.port) : null,
    username: cfg.username ?? null,
    schema: null,
    searchPath: null
  };

  if (db.getDialect() === "postgres") {
    try {
      const rows = (await db.query<{
        current_schema: string;
        current_database: string;
        search_path: string;
      }>(
        `SELECT
          current_schema() AS current_schema,
          current_database() AS current_database,
          current_setting('search_path') AS search_path`,
        { type: QueryTypes.SELECT }
      )) as {
        current_schema: string;
        current_database: string;
        search_path: string;
      }[];
      snapshot.schema = rows[0]?.current_schema ?? null;
      snapshot.database = rows[0]?.current_database ?? snapshot.database;
      snapshot.searchPath = rows[0]?.search_path ?? null;
    } catch {
      snapshot.schema = "public";
    }
  } else if (db.getDialect() === "mysql" || db.getDialect() === "mariadb") {
    try {
      const rows = (await db.query<{ db: string }>(
        `SELECT DATABASE() AS db`,
        { type: QueryTypes.SELECT }
      )) as { db: string }[];
      snapshot.database = rows[0]?.db ?? snapshot.database;
      snapshot.schema = rows[0]?.db ?? null;
    } catch {
      // ignore
    }
  }

  return snapshot;
}

export async function logDbConnectionAtStartup(sequelize: Sequelize): Promise<void> {
  try {
    const info = await getDbConnectionSnapshot(sequelize);
    logger.info(
      {
        msg: "[DB] connection",
        dialect: info.dialect,
        database: info.database,
        host: info.host,
        port: info.port,
        username: info.username,
        schema: info.schema,
        searchPath: info.searchPath
      },
      "[DB] Sequelize connected"
    );
  } catch (err) {
    logger.warn(
      { err: err instanceof Error ? err.message : err },
      "[DB] failed to log connection snapshot"
    );
  }
}
