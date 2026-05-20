import Message from "../models/Message";
import {
  loadContactsByPhones,
  resolveGroupParticipantDisplay
} from "./resolveGroupParticipantDisplay";

export type MessageWithParticipantDisplay = Record<string, unknown> & {
  displayParticipantName?: string;
  participantPhone?: string | null;
  participantName?: string | null;
};

function toPlainMessage(message: Message): MessageWithParticipantDisplay {
  return message.get({ plain: true }) as MessageWithParticipantDisplay;
}

export function enrichSingleGroupMessage(
  message: Message,
  contactByPhone?: Map<string, import("../models/Contact").default>
): MessageWithParticipantDisplay {
  const plain = toPlainMessage(message);
  if (plain.fromMe) {
    return plain;
  }

  let contact = plain.contact as
    | { name?: string; number?: string }
    | undefined;

  const phoneHint =
    resolveGroupParticipantDisplay({
      contact,
      participant: plain.participant as string,
      dataJson: plain.dataJson as string
    }).participantPhone;

  if (phoneHint && contactByPhone?.has(phoneHint)) {
    const better = contactByPhone.get(phoneHint);
    if (better) {
      contact = { name: better.name, number: better.number };
    }
  }

  const resolved = resolveGroupParticipantDisplay({
    contact,
    participant: plain.participant as string,
    dataJson: plain.dataJson as string
  });

  return {
    ...plain,
    displayParticipantName: resolved.displayName,
    participantPhone: resolved.participantPhone,
    participantName: resolved.participantName
  };
}

export async function enrichMessagesWithGroupParticipantDisplay(
  messages: Message[],
  companyId: number
): Promise<MessageWithParticipantDisplay[]> {
  const phones: string[] = [];
  for (const m of messages) {
    if (m.fromMe) continue;
    const hint = resolveGroupParticipantDisplay({
      contact: m.contact,
      participant: m.participant,
      dataJson: m.dataJson
    }).participantPhone;
    if (hint) phones.push(hint);
  }

  const contactByPhone = await loadContactsByPhones(companyId, phones);

  return messages.map((m) => enrichSingleGroupMessage(m, contactByPhone));
}
