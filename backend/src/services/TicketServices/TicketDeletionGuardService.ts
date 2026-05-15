import { Op, Transaction } from "sequelize";
import Ticket from "../../models/Ticket";
import TicketDeletionGuard from "../../models/TicketDeletionGuard";
import { logger } from "../../utils/logger";

function guardWhereClause(
  companyId: number,
  contactId: number,
  whatsappId?: number | null
) {
  const where: Record<string, unknown> = { companyId, contactId };
  if (whatsappId != null && whatsappId !== undefined) {
    where.whatsappId = whatsappId;
  } else {
    where.whatsappId = { [Op.is]: null };
  }
  return where;
}

const GRACE_MS = 2000;

export class TicketRecreationBlockedError extends Error {
  readonly code = "TICKET_RECREATION_BLOCKED";

  constructor(
    public readonly companyId: number,
    public readonly contactId: number,
    public readonly whatsappId: number,
    public readonly deletedAt: Date,
    public readonly messageTimestamp?: Date | null
  ) {
    super("TICKET_RECREATION_BLOCKED");
    this.name = "TicketRecreationBlockedError";
  }
}

export const registerTicketDeletionGuard = async (
  ticket: Ticket,
  deletedBy?: number | null,
  transaction?: Transaction
): Promise<void> => {
  if (!ticket.contactId) {
    logger.warn(
      {
        ticketId: ticket.id,
        companyId: ticket.companyId,
        whatsappId: ticket.whatsappId ?? null
      },
      "[TicketDeletionGuard] skipped — ticket without contactId"
    );
    return;
  }

  const deletedAt = new Date();
  const whatsappId =
    ticket.whatsappId != null && ticket.whatsappId !== undefined
      ? ticket.whatsappId
      : null;

  await TicketDeletionGuard.upsert(
    {
      companyId: ticket.companyId,
      contactId: ticket.contactId,
      whatsappId,
      deletedAt,
      deletedBy: deletedBy ?? null,
      lastTicketId: ticket.id
    },
    { transaction }
  );

  logger.info(
    {
      companyId: ticket.companyId,
      ticketId: ticket.id,
      contactId: ticket.contactId,
      whatsappId,
      deletedAt: deletedAt.toISOString(),
      deletedBy: deletedBy ?? null
    },
    "[TicketDeletionGuard] registered"
  );
};

export const clearTicketDeletionGuard = async (
  companyId: number,
  contactId: number,
  whatsappId?: number | null,
  transaction?: Transaction
): Promise<void> => {
  const removed = await TicketDeletionGuard.destroy({
    where: guardWhereClause(companyId, contactId, whatsappId),
    transaction
  });

  if (removed) {
    logger.info(
      { companyId, contactId, whatsappId },
      "[TicketDeletionGuard] cleared after new message"
    );
  }
};

/**
 * Bloqueia recriação por mensagens antigas/sincronização após exclusão manual.
 * Mensagens com timestamp após deletedAt liberam novo ticket.
 */
export const assertTicketRecreationAllowed = async ({
  companyId,
  contactId,
  whatsappId,
  messageReceivedAt,
  forceCreate = false
}: {
  companyId: number;
  contactId: number;
  whatsappId?: number | null;
  messageReceivedAt?: Date | null;
  forceCreate?: boolean;
}): Promise<void> => {
  if (forceCreate) {
    await clearTicketDeletionGuard(companyId, contactId, whatsappId);
    return;
  }

  const guard = await TicketDeletionGuard.findOne({
    where: guardWhereClause(companyId, contactId, whatsappId)
  });

  if (!guard) {
    return;
  }

  const deletedAt = new Date(guard.deletedAt);

  if (messageReceivedAt) {
    const messageMs = messageReceivedAt.getTime();
    const deletedMs = deletedAt.getTime();

    if (messageMs > deletedMs + GRACE_MS) {
      await clearTicketDeletionGuard(companyId, contactId, whatsappId);
      logger.info(
        {
          companyId,
          contactId,
          whatsappId,
          deletedAt: deletedAt.toISOString(),
          messageTimestamp: messageReceivedAt.toISOString()
        },
        "[FindOrCreateTicket] guard cleared — new message after deletion"
      );
      return;
    }
  }

  logger.info(
    {
      companyId,
      contactId,
      whatsappId,
      deletedAt: deletedAt.toISOString(),
      messageTimestamp: messageReceivedAt?.toISOString() ?? null,
      lastTicketId: guard.lastTicketId
    },
    "[FindOrCreateTicket] skip recreate deleted ticket"
  );

  throw new TicketRecreationBlockedError(
    companyId,
    contactId,
    whatsappId ?? 0,
    deletedAt,
    messageReceivedAt
  );
};
