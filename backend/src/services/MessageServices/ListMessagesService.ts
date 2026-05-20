import { FindOptions } from "sequelize/types";
import { Op } from "sequelize";
import AppError from "../../errors/AppError";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import ShowTicketService from "../TicketServices/ShowTicketService";
import Queue from "../../models/Queue";
import {
  enrichMessagesWithGroupParticipantDisplay,
  MessageWithParticipantDisplay
} from "../../helpers/enrichGroupMessagesDisplay";

interface Request {
  ticketId: string;
  companyId: number;
  pageNumber?: string;
  queues?: number[];
  /** Quando o ticket está atribuído a este utilizador, não filtra mensagens por fila. */
  actorUserId?: string | number;
}

interface Response {
  messages: Message[] | MessageWithParticipantDisplay[];
  ticket: Ticket;
  count: number;
  hasMore: boolean;
}

const ListMessagesService = async ({
  pageNumber = "1",
  ticketId,
  companyId,
  queues = [],
  actorUserId
}: Request): Promise<Response> => {
  const ticket = await ShowTicketService(ticketId, companyId);

  if (!ticket) {
    throw new AppError("ERR_NO_TICKET_FOUND", 404);
  }

  // await setMessagesAsRead(ticket);
  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const options: FindOptions = {
    where: {
      ticketId,
      companyId
    }
  };

  const isDirectAssignee =
    actorUserId != null &&
    ticket.userId != null &&
    Number(ticket.userId) === Number(actorUserId);

  if (queues.length > 0 && !isDirectAssignee) {
    options.where["queueId"] = {
      [Op.or]: {
        [Op.in]: queues,
        [Op.eq]: null
      }
    };
  }

  const { count, rows: messages } = await Message.findAndCountAll({
    ...options,
    limit,
    include: [
      "contact",
      {
        model: Message,
        as: "quotedMsg",
        include: ["contact"]
      },
      {
        model: Queue,
        as: "queue"
      }
    ],
    offset,
    order: [["createdAt", "DESC"]]
  });

  const hasMore = count > offset + messages.length;

  const ordered = messages.reverse();
  const enrichedMessages = ticket.isGroup
    ? await enrichMessagesWithGroupParticipantDisplay(ordered, companyId)
    : ordered;

  return {
    messages: enrichedMessages,
    ticket,
    count,
    hasMore
  };
};

export default ListMessagesService;
