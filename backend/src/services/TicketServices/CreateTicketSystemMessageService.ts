import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";
import { getIO } from "../../libs/socket";
import Message from "../../models/Message";
import ShowTicketService from "./ShowTicketService";
import { logger } from "../../utils/logger";

type Request = {
  ticketId: number | string;
  companyId: number;
  body: string;
  /** Evita spam: não recria a mesma msg no intervalo. */
  dedupeWithinSeconds?: number;
};

/**
 * Cria uma mensagem "interna/sistema" no ticket, visível para atendentes,
 * sem enviar nada ao WhatsApp do cliente.
 */
const CreateTicketSystemMessageService = async ({
  ticketId,
  companyId,
  body,
  dedupeWithinSeconds = 60
}: Request): Promise<Message | null> => {
  const trimmed = String(body || "").trim();
  if (!trimmed) return null;

  // Dedupe simples (evita criar a mesma msg repetidamente no mesmo ticket)
  try {
    const since = new Date(Date.now() - dedupeWithinSeconds * 1000);
    const existing = await Message.findOne({
      where: {
        ticketId: Number(ticketId),
        companyId,
        fromMe: true,
        mediaType: "system",
        body: trimmed,
        createdAt: { [Op.gte]: since }
      },
      order: [["createdAt", "DESC"]]
    });
    if (existing) return null;
  } catch {
    // ignore dedupe errors
  }

  const ticket = await ShowTicketService(ticketId, companyId);

  const id = uuidv4();
  await Message.create({
    id,
    ticketId: ticket.id,
    companyId,
    contactId: ticket.contactId,
    body: trimmed,
    fromMe: true,
    read: true,
    ack: 0,
    mediaType: "system",
    remoteJid: "system",
    participant: "system",
    dataJson: "{}"
  } as any);

  const message = await Message.findByPk(id, {
    include: [
      "contact",
      {
        association: "ticket",
        include: [
          "contact",
          "queue",
          {
            association: "whatsapp",
            attributes: ["name"]
          }
        ]
      },
      {
        association: "quotedMsg",
        include: ["contact"]
      }
    ]
  });

  if (!message) return null;

  const io = getIO();
  io.to(message.ticketId.toString())
    .to(`company-${companyId}-${message.ticket.status}`)
    .to(`company-${companyId}-notification`)
    .to(`company-${companyId}-mainchannel`)
    .to(`queue-${message.ticket.queueId}-${message.ticket.status}`)
    .to(`queue-${message.ticket.queueId}-notification`)
    .emit(`company-${companyId}-appMessage`, {
      action: "create",
      message,
      ticket: message.ticket,
      contact: message.ticket.contact
    });

  logger.info(
    { companyId, ticketId: Number(ticketId) },
    "[TicketSystemMessage] created"
  );

  return message;
};

export default CreateTicketSystemMessageService;

