import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable("TicketDeletionGuards", {
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
      contactId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Contacts", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      whatsappId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Whatsapps", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      deletedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      lastTicketId: {
        type: DataTypes.INTEGER,
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
    }).then(() =>
      queryInterface.addConstraint("TicketDeletionGuards", {
        fields: ["companyId", "contactId", "whatsappId"],
        type: "unique",
        name: "ticket_deletion_guards_company_contact_whatsapp_unique"
      })
    );
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.dropTable("TicketDeletionGuards");
  }
};
