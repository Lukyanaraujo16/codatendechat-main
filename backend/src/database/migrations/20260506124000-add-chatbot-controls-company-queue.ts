module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Companies", "chatbotDisabled", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.addColumn("Companies", "chatbotScheduleEnabled", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.addColumn("Companies", "chatbotSchedule", {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn("Queues", "chatbotDisabled", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("Queues", "chatbotDisabled");
    await queryInterface.removeColumn("Companies", "chatbotSchedule");
    await queryInterface.removeColumn("Companies", "chatbotScheduleEnabled");
    await queryInterface.removeColumn("Companies", "chatbotDisabled");
  }
};

