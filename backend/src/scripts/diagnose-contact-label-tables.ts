/**
 * Diagnóstico: etiquetas via Sequelize model (mesmo caminho da aplicação).
 * Uso: npm run build && node dist/scripts/diagnose-contact-label-tables.js
 */
import "../bootstrap";
import sequelize from "../database";
import { getDbConnectionSnapshot } from "../helpers/dbConnectionInfo";
import {
  assertContactLabelRelationModelRegistered,
  getContactLabelRelationModel,
  logContactLabelRelationModelTable
} from "../helpers/contactLabelRelationsTable";
import ContactLabel from "../models/ContactLabel";

async function main(): Promise<void> {
  const db = await getDbConnectionSnapshot(sequelize);

  // eslint-disable-next-line no-console
  console.log("\n=== DB connection (app) ===");
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(db, null, 2));

  assertContactLabelRelationModelRegistered(sequelize);
  logContactLabelRelationModelTable(sequelize);

  const relationModel = getContactLabelRelationModel(sequelize);
  const labelModel = sequelize.models.ContactLabel as typeof ContactLabel;

  try {
    await relationModel.count();
    // eslint-disable-next-line no-console
    console.log("\n=== ContactLabelRelation.count() === OK");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("\n=== ContactLabelRelation.count() === FAILED");
    console.error(err);
  }

  try {
    const n = await labelModel.count();
    // eslint-disable-next-line no-console
    console.log(`\n=== ContactLabels.count() === ${n}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("\n=== ContactLabels.count() === FAILED");
    console.error(err);
  }

  try {
    const qi = sequelize.getQueryInterface();
    const desc = await qi.describeTable(
      relationModel.getTableName() as string
    );
    // eslint-disable-next-line no-console
    console.log("\n=== describeTable(ContactLabelRelations) ===");
    // eslint-disable-next-line no-console
    console.log(Object.keys(desc).join(", "));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("\n=== describeTable failed ===");
    console.error(err);
  }

  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
