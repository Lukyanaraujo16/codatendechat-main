import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("ChatMessages", "mediaType", {
      type: DataTypes.STRING(32),
      allowNull: true
    });
    await queryInterface.addColumn("ChatMessages", "mimeType", {
      type: DataTypes.STRING(128),
      allowNull: true
    });
    await queryInterface.addColumn("ChatMessages", "mediaSize", {
      type: DataTypes.BIGINT,
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("ChatMessages", "mediaSize");
    await queryInterface.removeColumn("ChatMessages", "mimeType");
    await queryInterface.removeColumn("ChatMessages", "mediaType");
  }
};

