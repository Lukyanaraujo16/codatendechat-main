import { Transaction } from "sequelize";
import sequelize from "../../database";
import Ticket from "../../models/Ticket";
import AppError from "../../errors/AppError";
import Message from "../../models/Message";
import TicketTag from "../../models/TicketTag";
import TicketTraking from "../../models/TicketTraking";
import FlowExecutionLog from "../../models/FlowExecutionLog";
import OpenAiUsage from "../../models/OpenAiUsage";
import UserRating from "../../models/UserRating";
import TicketNote from "../../models/TicketNote";
import { logger } from "../../utils/logger";

async function destroyTicketDependents(ticketId: number, transaction: Transaction): Promise<void> {
  await Message.destroy({ where: { ticketId }, transaction });
  await TicketTag.destroy({ where: { ticketId }, transaction });
  await TicketTraking.destroy({ where: { ticketId }, transaction });
  await FlowExecutionLog.destroy({
    where: { ticket_id: ticketId },
    transaction
  });
  await OpenAiUsage.destroy({ where: { ticketId }, transaction });
  await UserRating.destroy({ where: { ticketId }, transaction });
  await TicketNote.destroy({ where: { ticketId }, transaction });
}

const DeleteTicketService = async (
  id: string,
  companyId: number
): Promise<Ticket> => {
  const ticket = await Ticket.findOne({
    where: { id, companyId }
  });

  if (!ticket) {
    throw new AppError("ERR_NO_TICKET_FOUND", 404);
  }

  const ticketIdNum = ticket.id;

  try {
    await ticket.destroy();
    logger.info(
      { ticketId: ticketIdNum, companyId },
      "[TicketDelete] ticket destroyed"
    );
    return ticket;
  } catch (err: unknown) {
    const name = err instanceof Error ? err.name : "";
    logger.error(
      {
        err,
        ticketId: ticketIdNum,
        companyId,
        message: err instanceof Error ? err.message : String(err)
      },
      "[TicketDeleteError] ticket.destroy failed"
    );

    if (name === "SequelizeForeignKeyConstraintError") {
      logger.warn(
        { ticketId: ticketIdNum, companyId },
        "[OrphanTicketDetected] forcing delete of dependents then ticket"
      );
      await sequelize.transaction(async (t: Transaction) => {
        await destroyTicketDependents(ticketIdNum, t);
        await Ticket.destroy({
          where: { id: ticketIdNum, companyId },
          transaction: t
        });
      });
      logger.info(
        { ticketId: ticketIdNum, companyId },
        "[TicketDelete] ticket destroyed after cascade"
      );
      return ticket;
    }

    throw err;
  }
};

export default DeleteTicketService;
