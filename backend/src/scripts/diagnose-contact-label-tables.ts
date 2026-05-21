/**
 * Diagnóstico: tabelas de etiquetas no banco usado pelo backend.
 * Uso: npm run build && node dist/scripts/diagnose-contact-label-tables.js
 */
import "../bootstrap";
import sequelize from "../database";
import { getDbConnectionSnapshot } from "../helpers/dbConnectionInfo";
import { findTablesWithSchemas } from "../helpers/tableExists";
import {
  getContactLabelRelationsTableName,
  warmupContactLabelRelationsTable
} from "../helpers/contactLabelRelationsTable";

async function main(): Promise<void> {
  const db = await getDbConnectionSnapshot();
  // eslint-disable-next-line no-console
  console.log("\n=== DB connection (app) ===");
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(db, null, 2));

  const contactLabel = await findTablesWithSchemas("%contact%label%");
  const labelOnly = await findTablesWithSchemas("%label%");

  // eslint-disable-next-line no-console
  console.log("\n=== tables ILIKE %contact%label% ===");
  // eslint-disable-next-line no-console
  console.table(contactLabel);

  // eslint-disable-next-line no-console
  console.log("\n=== tables ILIKE %label% ===");
  // eslint-disable-next-line no-console
  console.table(labelOnly);

  const resolved = await warmupContactLabelRelationsTable({ refresh: true });
  // eslint-disable-next-line no-console
  console.log("\n=== resolved ContactLabelRelations table ===");
  // eslint-disable-next-line no-console
  console.log(resolved ?? "(not found)");

  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
