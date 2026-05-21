import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface
      .createTable("ContactAssignments", {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        contactId: {
          type: DataTypes.INTEGER,
          references: { model: "Contacts", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          allowNull: false
        },
        userId: {
          type: DataTypes.INTEGER,
          references: { model: "Users", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          allowNull: false
        },
        companyId: {
          type: DataTypes.INTEGER,
          references: { model: "Companies", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          allowNull: false
        },
        assignedByUserId: {
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
      })
      .then(() =>
        queryInterface.addIndex(
          "ContactAssignments",
          ["contactId", "userId", "companyId"],
          {
            unique: true,
            name: "contact_assignments_contact_user_company_unique"
          }
        )
      )
      .then(() =>
        queryInterface.addIndex("ContactAssignments", ["companyId"])
      )
      .then(() =>
        queryInterface.addIndex("ContactAssignments", ["userId", "companyId"])
      )
      .then(() =>
        queryInterface.addIndex("ContactAssignments", ["contactId"])
      );
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.dropTable("ContactAssignments");
  }
};
