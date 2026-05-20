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
  HasMany,
  AllowNull
} from "sequelize-typescript";
import Company from "./Company";
import User from "./User";
import ContactLabelRelation from "./ContactLabelRelation";

@Table({ tableName: "ContactLabels" })
class ContactLabel extends Model<ContactLabel> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  name: string;

  @Column
  color: string;

  @AllowNull(true)
  @Column
  description: string;

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

  @HasMany(() => ContactLabelRelation)
  relations: ContactLabelRelation[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default ContactLabel;
