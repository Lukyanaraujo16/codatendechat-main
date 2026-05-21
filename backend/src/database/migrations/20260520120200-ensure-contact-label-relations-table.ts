import { QueryInterface, DataTypes } from "sequelize";

const CANONICAL = "ContactLabelRelations";

function normalizeKey(name: string): string {
  return name.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

async function listTables(queryInterface: QueryInterface): Promise<string[]> {
  const tables = await queryInterface.showAllTables();
  return (Array.isArray(tables) ? tables : []).map((t) =>
    typeof t === "string" ? t : String((t as { tableName?: string }).tableName || t)
  );
}

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const tables = await listTables(queryInterface);
    const byKey = new Map(tables.map((t) => [normalizeKey(t), t]));

    const canonicalKey = normalizeKey(CANONICAL);
    if (byKey.has(canonicalKey)) {
      return;
    }

    const snakeKey = normalizeKey("contact_label_relations");
    if (byKey.has(snakeKey)) {
      const from = byKey.get(snakeKey)!;
      await queryInterface.renameTable(from, CANONICAL);
      return;
    }

    const legacyKey = normalizeKey("contactlabelrelations");
    if (byKey.has(legacyKey)) {
      const from = byKey.get(legacyKey)!;
      if (from !== CANONICAL) {
        await queryInterface.renameTable(from, CANONICAL);
      }
      return;
    }

    // Tabela inexistente: delega à migration de criação (re-executa create se necessário)
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
    // no-op: não remover tabela em rollback automático
  }
};
