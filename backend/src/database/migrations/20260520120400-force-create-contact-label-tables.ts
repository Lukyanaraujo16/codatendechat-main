import { QueryInterface, DataTypes, QueryTypes } from "sequelize";

const SCHEMA_PUBLIC = "public";
const TABLE_LABELS = "ContactLabels";
const TABLE_RELATIONS = "ContactLabelRelations";

const INDEX_LABELS_COMPANY_NAME = "contact_labels_company_name_unique";
const INDEX_RELATIONS_CONTACT_LABEL = "contact_label_relations_contact_label_unique";
const INDEX_RELATIONS_COMPANY = "contact_label_relations_company_id";
const INDEX_RELATIONS_CONTACT = "contact_label_relations_contact_id";
const INDEX_RELATIONS_LABEL = "contact_label_relations_label_id";

type ExistsRow = { ok: number };

async function tableExistsInSchema(
  queryInterface: QueryInterface,
  tableName: string,
  schema: string = SCHEMA_PUBLIC
): Promise<boolean> {
  const { sequelize } = queryInterface;
  const dialect = sequelize.getDialect();

  if (dialect === "postgres") {
    let rows = (await sequelize.query<ExistsRow>(
      `SELECT 1 AS ok
       FROM information_schema.tables
       WHERE table_schema = :schema
         AND table_name = :tableName
       LIMIT 1`,
      {
        replacements: { schema, tableName },
        type: QueryTypes.SELECT
      }
    )) as ExistsRow[];
    if (rows.length > 0) return true;

    rows = (await sequelize.query<ExistsRow>(
      `SELECT 1 AS ok
       FROM information_schema.tables
       WHERE table_schema = :schema
         AND lower(table_name) = lower(:tableName)
       LIMIT 1`,
      {
        replacements: { schema, tableName },
        type: QueryTypes.SELECT
      }
    )) as ExistsRow[];
    return rows.length > 0;
  }

  if (dialect === "mysql" || dialect === "mariadb") {
    const rows = (await sequelize.query<ExistsRow>(
      `SELECT 1 AS ok
       FROM information_schema.tables
       WHERE table_schema = DATABASE()
         AND table_name = :tableName
       LIMIT 1`,
      {
        replacements: { tableName },
        type: QueryTypes.SELECT
      }
    )) as ExistsRow[];
    return rows.length > 0;
  }

  const tables = await queryInterface.showAllTables();
  const list = (Array.isArray(tables) ? tables : []).map((t) =>
    typeof t === "string" ? t : String((t as { tableName?: string }).tableName || t)
  );
  return list.includes(tableName);
}

async function indexExists(
  queryInterface: QueryInterface,
  tableName: string,
  indexName: string
): Promise<boolean> {
  const { sequelize } = queryInterface;
  const dialect = sequelize.getDialect();

  try {
    if (dialect === "postgres") {
      const rows = (await sequelize.query<ExistsRow>(
        `SELECT 1 AS ok
         FROM pg_indexes
         WHERE schemaname = :schema
           AND tablename = :tableName
           AND indexname = :indexName
         LIMIT 1`,
        {
          replacements: {
            schema: SCHEMA_PUBLIC,
            tableName,
            indexName
          },
          type: QueryTypes.SELECT
        }
      )) as ExistsRow[];
      return rows.length > 0;
    }

    if (dialect === "mysql" || dialect === "mariadb") {
      const rows = (await sequelize.query<ExistsRow>(
        `SELECT 1 AS ok
         FROM information_schema.statistics
         WHERE table_schema = DATABASE()
           AND table_name = :tableName
           AND index_name = :indexName
         LIMIT 1`,
        {
          replacements: { tableName, indexName },
          type: QueryTypes.SELECT
        }
      )) as ExistsRow[];
      return rows.length > 0;
    }
  } catch {
    return false;
  }

  return false;
}

async function safeAddIndex(
  queryInterface: QueryInterface,
  tableName: string,
  fields: string[],
  options: { unique?: boolean; name: string }
): Promise<void> {
  if (await indexExists(queryInterface, tableName, options.name)) {
    return;
  }
  try {
    await queryInterface.addIndex(tableName, fields, options);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/already exists|duplicate/i.test(msg)) {
      return;
    }
    throw err;
  }
}

async function ensureContactLabelsTable(
  queryInterface: QueryInterface
): Promise<void> {
  const exists = await tableExistsInSchema(queryInterface, TABLE_LABELS);
  if (exists) {
    return;
  }

  await queryInterface.createTable(TABLE_LABELS, {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    companyId: {
      type: DataTypes.INTEGER,
      references: { model: "Companies", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(80),
      allowNull: false
    },
    color: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
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
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  });

  await safeAddIndex(queryInterface, TABLE_LABELS, ["companyId", "name"], {
    unique: true,
    name: INDEX_LABELS_COMPANY_NAME
  });
}

async function ensureContactLabelRelationsTable(
  queryInterface: QueryInterface
): Promise<void> {
  const exists = await tableExistsInSchema(queryInterface, TABLE_RELATIONS);
  if (exists) {
    return;
  }

  await queryInterface.createTable(TABLE_RELATIONS, {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    companyId: {
      type: DataTypes.INTEGER,
      references: { model: "Companies", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
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
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  });

  await safeAddIndex(
    queryInterface,
    TABLE_RELATIONS,
    ["contactId", "labelId"],
    { unique: true, name: INDEX_RELATIONS_CONTACT_LABEL }
  );
  await safeAddIndex(queryInterface, TABLE_RELATIONS, ["companyId"], {
    name: INDEX_RELATIONS_COMPANY
  });
  await safeAddIndex(queryInterface, TABLE_RELATIONS, ["contactId"], {
    name: INDEX_RELATIONS_CONTACT
  });
  await safeAddIndex(queryInterface, TABLE_RELATIONS, ["labelId"], {
    name: INDEX_RELATIONS_LABEL
  });
}

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await ensureContactLabelsTable(queryInterface);
    await ensureContactLabelRelationsTable(queryInterface);
  },

  down: async () => {
    // no-op: não remover tabelas em produção
  }
};
