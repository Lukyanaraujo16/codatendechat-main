import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("UserFeaturePermissions", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      featureKey: {
        type: DataTypes.STRING(128),
        allowNull: false
      },
      enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
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

    await queryInterface.addIndex("UserFeaturePermissions", ["userId", "featureKey"], {
      unique: true,
      name: "UserFeaturePermissions_userId_featureKey_unique"
    });
    await queryInterface.addIndex("UserFeaturePermissions", ["companyId"], {
      name: "UserFeaturePermissions_companyId_idx"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("UserFeaturePermissions");
  }
};
