import Setting from "../models/Setting";
import Whatsapp from "../models/Whatsapp";
import Company from "../models/Company";

export type CallHandlingMode = "accept" | "reject";
export type GroupMessagesMode = "ignore" | "receive";

export type WhatsappBehaviorEffective = {
  callHandlingMode: CallHandlingMode;
  sendMessageOnCallReject: boolean;
  callRejectMessage: string;
  groupMessagesMode: GroupMessagesMode;
  usesGlobalFallback: boolean;
};

const DEFAULT_CALL_REJECT_MESSAGES: Record<string, string> = {
  pt: "*Mensagem automática*\n\nEste número não recebe chamadas. Envie uma mensagem de texto que responderemos por aqui.",
  en: "*Automatic message*\n\nThis number does not accept calls. Please send a text message and we will reply here.",
  es: "*Mensaje automático*\n\nEste número no recibe llamadas. Envíe un mensaje de texto y responderemos aquí."
};

export async function getGlobalBehaviorFallback(
  companyId: number
): Promise<WhatsappBehaviorEffective> {
  const rows = await Setting.findAll({
    where: {
      companyId,
      key: ["call", "callRejectSendMessage", "callRejectMessage", "CheckMsgIsGroup"]
    }
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));

  const callVal = map.get("call");
  const callHandlingMode: CallHandlingMode =
    callVal === "disabled" ? "reject" : "accept";

  const crs = map.get("callRejectSendMessage");
  const sendMessageOnCallReject = crs == null ? true : crs !== "disabled";

  const callRejectMessage =
    map.get("callRejectMessage") != null
      ? String(map.get("callRejectMessage"))
      : "";

  const groupVal = map.get("CheckMsgIsGroup");
  const groupMessagesMode: GroupMessagesMode =
    groupVal === "enabled" ? "ignore" : "receive";

  return {
    callHandlingMode,
    sendMessageOnCallReject,
    callRejectMessage,
    groupMessagesMode,
    usesGlobalFallback: true
  };
}

export async function resolveDefaultCallRejectText(
  companyId: number,
  customMessage?: string | null
): Promise<string> {
  const trimmed =
    customMessage != null ? String(customMessage).trim() : "";
  if (trimmed.length > 0) {
    return trimmed;
  }
  const company = await Company.findByPk(companyId, { attributes: ["language"] });
  const lang = company?.language || "pt";
  const key = ["pt", "en", "es"].includes(lang) ? lang : "pt";
  return DEFAULT_CALL_REJECT_MESSAGES[key];
}

export async function resolveWhatsappBehavior(
  whatsappId: number,
  companyId: number
): Promise<WhatsappBehaviorEffective> {
  const global = await getGlobalBehaviorFallback(companyId);
  const wa = await Whatsapp.findOne({
    where: { id: whatsappId, companyId },
    attributes: [
      "id",
      "callHandlingMode",
      "sendMessageOnCallReject",
      "callRejectMessage",
      "groupMessagesMode"
    ]
  });

  if (!wa) {
    return global;
  }

  let usesGlobalFallback = false;

  let callHandlingMode: CallHandlingMode = global.callHandlingMode;
  if (wa.callHandlingMode === "accept" || wa.callHandlingMode === "reject") {
    callHandlingMode = wa.callHandlingMode;
  } else {
    usesGlobalFallback = true;
  }

  let sendMessageOnCallReject = global.sendMessageOnCallReject;
  if (wa.sendMessageOnCallReject != null) {
    sendMessageOnCallReject = Boolean(wa.sendMessageOnCallReject);
  } else {
    usesGlobalFallback = true;
  }

  let callRejectMessage = global.callRejectMessage;
  if (wa.callRejectMessage != null && String(wa.callRejectMessage).trim() !== "") {
    callRejectMessage = String(wa.callRejectMessage);
  } else if (wa.callRejectMessage == null) {
    usesGlobalFallback = true;
  }

  let groupMessagesMode: GroupMessagesMode = global.groupMessagesMode;
  if (wa.groupMessagesMode === "ignore" || wa.groupMessagesMode === "receive") {
    groupMessagesMode = wa.groupMessagesMode;
  } else {
    usesGlobalFallback = true;
  }

  return {
    callHandlingMode,
    sendMessageOnCallReject,
    callRejectMessage,
    groupMessagesMode,
    usesGlobalFallback
  };
}

export type WhatsappBehaviorRow = {
  id: number;
  name: string;
  status: string;
  callHandlingMode: CallHandlingMode;
  sendMessageOnCallReject: boolean;
  callRejectMessage: string;
  groupMessagesMode: GroupMessagesMode;
  usesPerConnectionConfig: boolean;
};

export async function listWhatsappBehaviorRows(
  companyId: number
): Promise<WhatsappBehaviorRow[]> {
  const global = await getGlobalBehaviorFallback(companyId);
  const whatsapps = await Whatsapp.findAll({
    where: { companyId },
    attributes: [
      "id",
      "name",
      "status",
      "callHandlingMode",
      "sendMessageOnCallReject",
      "callRejectMessage",
      "groupMessagesMode"
    ],
    order: [["name", "ASC"]]
  });

  return whatsapps.map((wa) => {
    const hasOwn =
      wa.callHandlingMode != null ||
      wa.sendMessageOnCallReject != null ||
      (wa.callRejectMessage != null && String(wa.callRejectMessage).trim() !== "") ||
      wa.groupMessagesMode != null;

    const callHandlingMode: CallHandlingMode =
      wa.callHandlingMode === "accept" || wa.callHandlingMode === "reject"
        ? wa.callHandlingMode
        : global.callHandlingMode;

    const sendMessageOnCallReject: boolean =
      wa.sendMessageOnCallReject != null
        ? Boolean(wa.sendMessageOnCallReject)
        : global.sendMessageOnCallReject;

    const callRejectMessage: string =
      wa.callRejectMessage != null && String(wa.callRejectMessage).trim() !== ""
        ? String(wa.callRejectMessage)
        : global.callRejectMessage;

    const groupMessagesMode: GroupMessagesMode =
      wa.groupMessagesMode === "ignore" || wa.groupMessagesMode === "receive"
        ? wa.groupMessagesMode
        : global.groupMessagesMode;

    return {
      id: wa.id,
      name: wa.name,
      status: wa.status,
      callHandlingMode,
      sendMessageOnCallReject,
      callRejectMessage,
      groupMessagesMode,
      usesPerConnectionConfig: hasOwn
    };
  });
}
