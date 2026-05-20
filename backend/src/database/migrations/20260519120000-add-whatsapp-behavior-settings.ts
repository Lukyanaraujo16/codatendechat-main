import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addColumn("Whatsapps", "callHandlingMode", {
        type: DataTypes.STRING(16),
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("Whatsapps", "sendMessageOnCallReject", {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("Whatsapps", "callRejectMessage", {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("Whatsapps", "groupMessagesMode", {
        type: DataTypes.STRING(16),
        allowNull: true,
        defaultValue: null
      })
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("Whatsapps", "callHandlingMode"),
      queryInterface.removeColumn("Whatsapps", "sendMessageOnCallReject"),
      queryInterface.removeColumn("Whatsapps", "callRejectMessage"),
      queryInterface.removeColumn("Whatsapps", "groupMessagesMode")
    ]);
  }
};
