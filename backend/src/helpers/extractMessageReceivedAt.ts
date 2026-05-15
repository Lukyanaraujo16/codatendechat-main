import { proto } from "@whiskeysockets/baileys";

/** Converte messageTimestamp do Baileys para Date (segundos ou ms). */
export const extractMessageReceivedAt = (
  msg: proto.IWebMessageInfo
): Date | null => {
  const raw = msg?.messageTimestamp;
  if (raw == null) {
    return null;
  }

  let n: number;
  if (typeof raw === "object" && raw !== null && "toNumber" in raw) {
    n = Number((raw as { toNumber: () => number }).toNumber());
  } else {
    n = Number(raw);
  }

  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }

  const ms = n > 1e12 ? n : n * 1000;
  return new Date(ms);
};
