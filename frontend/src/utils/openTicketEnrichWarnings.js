/** Códigos de enrichWarnings que justificam banner no painel de conversa. */
const USER_VISIBLE_ENRICH_WARNINGS = new Set([
  "messagesPartial",
  "ticketIncomplete",
]);

export function hasUserVisibleEnrichWarnings(warnings) {
  return (
    Array.isArray(warnings) &&
    warnings.some((code) => USER_VISIBLE_ENRICH_WARNINGS.has(code))
  );
}
