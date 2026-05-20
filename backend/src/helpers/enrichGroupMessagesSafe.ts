import Message from "../models/Message";
import {
  enrichMessagesWithGroupParticipantDisplay,
  MessageWithParticipantDisplay
} from "./enrichGroupMessagesDisplay";
import { logEnrichmentFailure } from "./enrichmentErrors";

/**
 * Enriquecimento de participante em grupos — nunca propaga erro ao caller.
 */
export async function enrichGroupMessagesSafe(
  messages: Message[],
  companyId: number,
  context: { ticketId: string | number }
): Promise<Message[] | MessageWithParticipantDisplay[]> {
  try {
    return await enrichMessagesWithGroupParticipantDisplay(messages, companyId);
  } catch (error) {
    logEnrichmentFailure(
      "groupParticipantDisplay",
      {
        companyId,
        ticketId: context.ticketId,
        messageCount: messages.length
      },
      error
    );
    return messages;
  }
}
