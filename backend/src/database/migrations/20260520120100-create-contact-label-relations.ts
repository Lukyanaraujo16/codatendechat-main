import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface
      .createTable("ContactLabelRelations", {
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
        labelId: {
          type: DataTypes.INTEGER,
          references: { model: "ContactLabels", key: "id" },
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
        createdBy: {
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
          "ContactLabelRelations",
          ["contactId", "labelId"],
          {
            unique: true,
            name: "contact_label_relations_contact_label_unique"
          }
        )
      )
      .then(() =>
        queryInterface.addIndex("ContactLabelRelations", ["companyId"])
      )
      .then(() =>
        queryInterface.addIndex("ContactLabelRelations", ["labelId"])
      );
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.dropTable("ContactLabelRelations");
  }
};
