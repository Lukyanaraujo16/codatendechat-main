import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addColumn("Helps", "thumbnailUrl", {
        type: DataTypes.STRING,
        allowNull: true
      }),
      queryInterface.addColumn("Helps", "category", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "Atendimento"
      }),
      queryInterface.addColumn("Helps", "helpOrder", {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      }),
      queryInterface.addColumn("Helps", "isFeatured", {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      })
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("Helps", "thumbnailUrl"),
      queryInterface.removeColumn("Helps", "category"),
      queryInterface.removeColumn("Helps", "helpOrder"),
      queryInterface.removeColumn("Helps", "isFeatured")
    ]);
  }
};
