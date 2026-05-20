import { formatDistanceToNow, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { i18n } from "../translate/i18n";

export function formatLabelLastUsed(isoDate) {
  if (!isoDate) {
    return i18n.t("contactLabelsManage.lastUsedNever");
  }
  const d = typeof isoDate === "string" ? parseISO(isoDate) : new Date(isoDate);
  if (!isValid(d)) {
    return i18n.t("contactLabelsManage.lastUsedNever");
  }
  return i18n.t("contactLabelsManage.lastUsedAgo", {
    time: formatDistanceToNow(d, { addSuffix: false, locale: ptBR }),
  });
}
