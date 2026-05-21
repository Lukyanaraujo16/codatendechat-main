/**
 * Diagnóstico: tabelas de etiquetas no banco usado pelo backend.
 * Uso: npm run build && node dist/scripts/diagnose-contact-label-tables.js
 */
import "../bootstrap";
import sequelize from "../database";
import { getDbConnectionSnapshot } from "../helpers/dbConnectionInfo";
import { findTablesWithSchemas } from "../helpers/tableExists";
import { warmupContactLabelRelationsTable } from "../helpers/contactLabelRelationsTable";

async function main(): Promise<void> {
  const db = await getDbConnectionSnapshot(sequelize);

  // eslint-disable-next-line no-console
  console.log("\n=== DB connection (app) ===");
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(db, null, 2));

  const contactLabel = await findTablesWithSchemas(sequelize, "%contact%label%");
  const labelOnly = await findTablesWithSchemas(sequelize, "%label%");

  // eslint-disable-next-line no-console
  console.log("\n=== tables ILIKE %contact%label% ===");
  for (const row of contactLabel) {
    // eslint-disable-next-line no-console
    console.log(`  ${row.table_schema}.${row.table_name}`);
  }
  if (!contactLabel.length) {
    // eslint-disable-next-line no-console
    console.log("  (none)");
  }

  // eslint-disable-next-line no-console
  console.log("\n=== tables ILIKE %label% ===");
  for (const row of labelOnly) {
    // eslint-disable-next-line no-console
    console.log(`  ${row.table_schema}.${row.table_name}`);
  }

  const resolved = await warmupContactLabelRelationsTable(sequelize, { refresh: true });
  // eslint-disable-next-line no-console
  console.log("\n=== resolved ContactLabelRelations table ===");
  // eslint-disable-next-line no-console
  console.log(resolved ? `${db.schema || "public"}.${resolved}` : "(not found)");

  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
