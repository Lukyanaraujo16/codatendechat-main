import moment from "moment-timezone";
import Company from "../models/Company";
import Queue from "../models/Queue";
import { logger } from "../utils/logger";

export type ChatbotBypassReason = "contact" | "company" | "queue" | "schedule" | null;

export type ShouldBypassChatbotInput = {
  companyId: number;
  contact?: { id?: number | string; disableBot?: boolean; chatbotDisabled?: boolean } | null;
  queueId?: number | null;
  ticketId?: number | string | null;
};

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type TimeRange = { start: string; end: string };
type ChatbotSchedule = {
  timezone?: string;
  days?: Partial<Record<DayKey, TimeRange[]>>;
};

function normalizeSchedule(raw: unknown): ChatbotSchedule | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as ChatbotSchedule;
  return s;
}

function dayKeyFromMoment(m: moment.Moment): DayKey {
  // isoWeekday: 1=Mon .. 7=Sun
  const d = m.isoWeekday();
  return d === 1
    ? "mon"
    : d === 2
      ? "tue"
      : d === 3
        ? "wed"
        : d === 4
          ? "thu"
          : d === 5
            ? "fri"
            : d === 6
              ? "sat"
              : "sun";
}

function parseHmToMinutes(hm: string): number | null {
  const m = String(hm || "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

function isNowWithinSchedule(now: moment.Moment, schedule: ChatbotSchedule): boolean {
  const tz = schedule.timezone || "America/Sao_Paulo";
  const localNow = now.clone().tz(tz);
  const dk = dayKeyFromMoment(localNow);
  const ranges = schedule.days?.[dk] || [];
  if (!Array.isArray(ranges) || ranges.length === 0) return false;
  const mins = localNow.hours() * 60 + localNow.minutes();
  return ranges.some((r) => {
    const s = parseHmToMinutes(r.start);
    const e = parseHmToMinutes(r.end);
    if (s == null || e == null) return false;
    // intervalo normal no mesmo dia
    if (e >= s) {
      return mins >= s && mins <= e;
    }
    // intervalo que cruza meia-noite (ex.: 22:00-02:00)
    return mins >= s || mins <= e;
  });
}

export async function shouldBypassChatbot(
  input: ShouldBypassChatbotInput
): Promise<{ bypass: boolean; reason: ChatbotBypassReason }> {
  const { companyId, contact, queueId, ticketId } = input;
  const contactId = contact?.id ?? null;

  // 1) Contato
  if (contact?.disableBot || contact?.chatbotDisabled) {
    logger.info(
      { companyId, contactId, ticketId, queueId, reason: "contact" },
      "[ChatbotBypass] chatbot skipped"
    );
    return { bypass: true, reason: "contact" };
  }

  // 2) Empresa
  const company = await Company.findByPk(companyId, {
    attributes: ["id", "chatbotDisabled", "chatbotScheduleEnabled", "chatbotSchedule", "timezone"]
  });
  if (company?.chatbotDisabled) {
    logger.info(
      { companyId, contactId, ticketId, queueId, reason: "company" },
      "[ChatbotBypass] chatbot skipped"
    );
    return { bypass: true, reason: "company" };
  }

  // 3) Fila
  if (queueId != null) {
    const q = await Queue.findByPk(queueId, { attributes: ["id", "companyId", "chatbotDisabled"] });
    if (q && Number(q.companyId) === Number(companyId) && q.chatbotDisabled) {
      logger.info(
        { companyId, contactId, ticketId, queueId, reason: "queue" },
        "[ChatbotBypass] chatbot skipped"
      );
      return { bypass: true, reason: "queue" };
    }
  }

  // 4) Horário
  if (company?.chatbotScheduleEnabled) {
    const schedule = normalizeSchedule(company.chatbotSchedule);
    const tz = schedule?.timezone || company.timezone || "America/Sao_Paulo";
    const effective = schedule ? { ...schedule, timezone: tz } : { timezone: tz, days: {} };
    const inside = schedule ? isNowWithinSchedule(moment(), effective) : true;
    if (!inside) {
      logger.info(
        { companyId, contactId, ticketId, queueId, reason: "schedule" },
        "[ChatbotBypass] chatbot skipped"
      );
      return { bypass: true, reason: "schedule" };
    }
  }

  return { bypass: false, reason: null };
}

