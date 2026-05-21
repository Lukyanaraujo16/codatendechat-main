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
import ContactLabel from "./ContactLabel";
import Company from "./Company";
import User from "./User";

@Table({ tableName: "ContactLabelRelations" })
class ContactLabelRelation extends Model<ContactLabelRelation> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Contact)
  @Column
  contactId: number;

  @BelongsTo(() => Contact)
  contact: Contact;

  @ForeignKey(() => ContactLabel)
  @Column
  labelId: number;

  @BelongsTo(() => ContactLabel)
  label: ContactLabel;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @ForeignKey(() => User)
  @AllowNull(true)
  @Column
  createdBy: number;

  @BelongsTo(() => User)
  creator: User;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default ContactLabelRelation;
