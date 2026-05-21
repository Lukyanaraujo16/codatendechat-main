import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  AllowNull
} from "sequelize-typescript";
import Contact from "./Contact";
import User from "./User";
import Company from "./Company";

@Table({ tableName: "ContactAssignments" })
class ContactAssignment extends Model<ContactAssignment> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Contact)
  @Column
  contactId: number;

  @BelongsTo(() => Contact)
  contact: Contact;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User, { foreignKey: "userId", as: "user" })
  user: User;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @ForeignKey(() => User)
  @AllowNull(true)
  @Column
  assignedByUserId: number;

  @BelongsTo(() => User, { foreignKey: "assignedByUserId", as: "assignedBy" })
  assignedBy: User;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default ContactAssignment;
