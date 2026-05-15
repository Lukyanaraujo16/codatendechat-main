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
import User from "./User";

@Table({ tableName: "TicketDeletionGuards" })
class TicketDeletionGuard extends Model<TicketDeletionGuard> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  companyId: number;

  @Column
  contactId: number;

  @AllowNull
  @Column
  whatsappId: number | null;

  @Column
  deletedAt: Date;

  @ForeignKey(() => User)
  @Column
  deletedBy: number;

  @BelongsTo(() => User)
  deletedByUser: User;

  @Column
  lastTicketId: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default TicketDeletionGuard;
