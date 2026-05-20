import {
  WASocket,
  Contact as BContact
} from "@whiskeysockets/baileys";
import * as Sentry from "@sentry/node";

import { Store } from "../../libs/store";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";
import createOrUpdateBaileysService from "../BaileysServices/CreateOrUpdateBaileysService";
import {
  resolveDefaultCallRejectText,
  resolveWhatsappBehavior
} from "../../helpers/whatsappBehaviorSettings";

type Session = WASocket & {
  id?: number;
  store?: Store;
};

const wbotMonitor = async (
  wbot: Session,
  whatsapp: Whatsapp,
  companyId: number
): Promise<void> => {
  try {
    wbot.ev.on("call", async (calls: unknown) => {
      const list = calls as Array<{
        status: string;
        id: string;
        from: string;
        chatId: string;
        isGroup?: boolean;
      }>;
      const call = list?.[0];
      if (!call || call.status !== "offer") {
        return;
      }
      if (call.isGroup) {
        return;
      }

      const whatsappId = whatsapp.id ?? wbot.id;
      if (!whatsappId) {
        return;
      }

      const behavior = await resolveWhatsappBehavior(whatsappId, companyId);

      if (behavior.callHandlingMode !== "reject") {
        return;
      }

      try {
        await wbot.rejectCall(call.id, call.from);
        logger.info(
          { companyId, whatsappId, sessionId: wbot.id, callId: call.id },
          "[call] chamada recebida rejeitada (configuração da conexão)"
        );
      } catch (err) {
        Sentry.captureException(err);
        logger.error(
          { err, companyId, whatsappId, callId: call.id },
          "[call] falha ao rejeitar chamada"
        );
      }

      if (!behavior.sendMessageOnCallReject) {
        return;
      }

      try {
        const text = await resolveDefaultCallRejectText(
          companyId,
          behavior.callRejectMessage
        );
        await wbot.sendMessage(call.chatId, { text });
      } catch (err) {
        Sentry.captureException(err);
        logger.error(
          { err, companyId, whatsappId },
          "[call] falha ao enviar mensagem após rejeitar"
        );
      }
    });

    wbot.ev.on("contacts.upsert", async (contacts: BContact[]) => {
      await createOrUpdateBaileysService({
        whatsappId: whatsapp.id,
        contacts
      });
    });
  } catch (err) {
    Sentry.captureException(err);
    logger.error(err);
  }
};

export default wbotMonitor;
