import type { ChatbotBypassReason } from "./shouldBypassChatbot";

type Lang = "pt" | "en" | "es";

function normalizeLang(raw: unknown): Lang {
  const v = String(raw || "").toLowerCase();
  if (v === "en") return "en";
  if (v === "es") return "es";
  return "pt";
}

export function formatChatbotBypassSystemMessage(options: {
  reason: ChatbotBypassReason;
  companyLanguage?: string | null;
}): string | null {
  const lang = normalizeLang(options.companyLanguage);
  const reason = options.reason;
  if (!reason) return null;

  const prefix =
    lang === "en"
      ? "Chatbot skipped:"
      : lang === "es"
        ? "Chatbot ignorado:"
        : "Chatbot ignorado:";

  const detail =
    reason === "contact"
      ? lang === "en"
        ? "disabled for this contact."
        : lang === "es"
          ? "desactivado solo para este contacto."
          : "desativado apenas para este contato."
      : reason === "company"
        ? lang === "en"
          ? "disabled for the whole company."
          : lang === "es"
            ? "desactivado para toda la empresa."
            : "desativado para toda a empresa."
        : reason === "queue"
          ? lang === "en"
            ? "disabled for this queue."
            : lang === "es"
              ? "desactivado para este sector."
              : "desativado para este setor."
          : lang === "en"
            ? "outside configured schedule."
            : lang === "es"
              ? "fuera del horario configurado."
              : "fora do horário configurado.";

  return `${prefix} ${detail}`;
}

export function formatChatbotInvalidMenuFallbackSystemMessage(options: {
  companyLanguage?: string | null;
  attempts: number;
}): string {
  const lang = normalizeLang(options.companyLanguage);
  const n = Number(options.attempts) || 3;
  if (lang === "en") {
    return `Chatbot forwarded to human support after ${n} invalid options.`;
  }
  if (lang === "es") {
    return `Chatbot encaminó a atención humana tras ${n} opciones inválidas.`;
  }
  return `Chatbot encaminhou para atendimento humano após ${n} opções inválidas.`;
}

