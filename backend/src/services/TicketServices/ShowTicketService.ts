import Ticket from "../../models/Ticket";
import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import User from "../../models/User";
import Queue from "../../models/Queue";
import Tag from "../../models/Tag";
import Whatsapp from "../../models/Whatsapp";
import Prompt from "../../models/Prompt";
import {
  setIsOrphanOnTicket,
  setStartedOutsideSystemOnTicket
} from "../../helpers/ticketOrphan";
import getLabelsForContactIds from "../../helpers/getLabelsForContactIds";

const ShowTicketService = async (
  id: string | number,
  companyId: number
): Promise<Ticket> => {
  const ticket = await Ticket.findByPk(id, {
    include: [
      {
        model: Contact,
        as: "contact",
        attributes: ["id", "name", "number", "email", "profilePicUrl", "isGroup", "groupVisible"],
        include: ["extraInfo"]
      },
      {
        model: User,
        as: "user",
        attributes: ["id", "name"]
      },
      {
        model: Queue,
        as: "queue",
        attributes: ["id", "name", "color"],
        include: ["prompt", "queueIntegrations"]
      },
      {
        model: Whatsapp,
        as: "whatsapp",
        attributes: ["name", "status"],
        required: false
      },
      {
        model: Tag,
        as: "tags",
        attributes: ["id", "name", "color"]
      }
    ]
  });

  if (!ticket) {
    throw new AppError("ERR_NO_TICKET_FOUND", 404);
  }

  if (ticket.companyId !== companyId) {
    throw new AppError("Não é possível consultar registros de outra empresa");
  }

  setIsOrphanOnTicket(ticket);
  setStartedOutsideSystemOnTicket(ticket);

  if (ticket.contact?.id) {
    const labelsMap = await getLabelsForContactIds(
      [ticket.contact.id],
      companyId
    );
    const labels = labelsMap.get(ticket.contact.id) ?? [];
    (ticket.contact as any).setDataValue?.("labels", labels);
    (ticket.contact as any).labels = labels;
  }

  return ticket;
};

export default ShowTicketService;
