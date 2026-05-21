import { QueryInterface, DataTypes } from "sequelize";

const TABLE = "ContactLabelRelations";
const COLUMN = "updatedAt";

async function hasColumn(
  queryInterface: QueryInterface,
  tableName: string,
  columnName: string
): Promise<boolean> {
  try {
    const desc = await queryInterface.describeTable(tableName);
    return Object.prototype.hasOwnProperty.call(desc, columnName);
  } catch {
    return false;
  }
}

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    if (await hasColumn(queryInterface, TABLE, COLUMN)) {
      return;
    }

    const dialect = queryInterface.sequelize.getDialect();

    if (dialect === "postgres") {
      await queryInterface.sequelize.query(
        `ALTER TABLE "${TABLE}"
         ADD COLUMN IF NOT EXISTS "${COLUMN}" TIMESTAMPTZ NOT NULL DEFAULT NOW()`
      );
      return;
    }

    await queryInterface.addColumn(TABLE, COLUMN, {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    });
  },

  down: async (queryInterface: QueryInterface) => {
    if (!(await hasColumn(queryInterface, TABLE, COLUMN))) {
      return;
    }
    await queryInterface.removeColumn(TABLE, COLUMN);
  }
};
