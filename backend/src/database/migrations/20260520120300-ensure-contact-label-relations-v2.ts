import { QueryInterface, DataTypes, QueryTypes } from "sequelize";

const CANONICAL = "ContactLabelRelations";

function normalizeKey(name: string): string {
  return name.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

type TableRow = { table_schema: string; table_name: string };

async function listRelationTables(
  queryInterface: QueryInterface
): Promise<TableRow[]> {
  const dialect = queryInterface.sequelize.getDialect();

  if (dialect === "postgres") {
    return (await queryInterface.sequelize.query<TableRow>(
      `SELECT table_schema, table_name
       FROM information_schema.tables
       WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
         AND table_type = 'BASE TABLE'
         AND table_name ILIKE '%contact%label%rel%'
       ORDER BY table_schema, table_name`,
      { type: QueryTypes.SELECT }
    )) as TableRow[];
  }

  if (dialect === "mysql" || dialect === "mariadb") {
    return (await queryInterface.sequelize.query<TableRow>(
      `SELECT table_schema, table_name
       FROM information_schema.tables
       WHERE table_schema = DATABASE()
         AND table_name LIKE '%contact%label%rel%'
       ORDER BY table_name`,
      { type: QueryTypes.SELECT }
    )) as TableRow[];
  }

  const tables = await queryInterface.showAllTables();
  return (Array.isArray(tables) ? tables : []).map((t) => ({
    table_schema: "main",
    table_name: typeof t === "string" ? t : String((t as { tableName?: string }).tableName || t)
  }));
}

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const rows = await listRelationTables(queryInterface);
    const byKey = new Map(rows.map((r) => [normalizeKey(r.table_name), r]));
    const canonicalKey = normalizeKey(CANONICAL);

    if (byKey.has(canonicalKey)) {
      return;
    }

    const snakeKey = normalizeKey("contact_label_relations");
    if (byKey.has(snakeKey)) {
      await queryInterface.renameTable(byKey.get(snakeKey)!.table_name, CANONICAL);
      return;
    }

    const legacyKey = normalizeKey("contactlabelrelations");
    if (byKey.has(legacyKey)) {
      const from = byKey.get(legacyKey)!.table_name;
      if (from !== CANONICAL) {
        await queryInterface.renameTable(from, CANONICAL);
      }
      return;
    }

    await queryInterface.createTable(CANONICAL, {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      contactId: {
        type: DataTypes.INTEGER,
        references: { model: "Contacts", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      labelId: {
        type: DataTypes.INTEGER,
        references: { model: "ContactLabels", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      companyId: {
        type: DataTypes.INTEGER,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      createdBy: {
        type: DataTypes.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });

    await queryInterface.addIndex(CANONICAL, ["contactId", "labelId"], {
      unique: true,
      name: "contact_label_relations_contact_label_unique"
    });
    await queryInterface.addIndex(CANONICAL, ["companyId"]);
    await queryInterface.addIndex(CANONICAL, ["labelId"]);
  },

  down: async () => {
    // no-op
  }
};
