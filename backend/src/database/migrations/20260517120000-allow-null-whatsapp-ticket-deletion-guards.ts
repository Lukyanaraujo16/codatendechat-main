import { QueryInterface } from "sequelize";

/**
 * Tickets órfãos podem ter whatsappId null; o guard precisa aceitar o mesmo valor.
 */
module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.query(
      `ALTER TABLE "TicketDeletionGuards" ALTER COLUMN "whatsappId" DROP NOT NULL;`
    );
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.query(
      `DELETE FROM "TicketDeletionGuards" WHERE "whatsappId" IS NULL;`
    ).then(() =>
      queryInterface.sequelize.query(
        `ALTER TABLE "TicketDeletionGuards" ALTER COLUMN "whatsappId" SET NOT NULL;`
      )
    );
  }
};
