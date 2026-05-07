module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn("Contacts", "chatbotDisabled", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn("Contacts", "chatbotDisabled");
  }
};

