import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo
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

  @Column
  whatsappId: number;

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
