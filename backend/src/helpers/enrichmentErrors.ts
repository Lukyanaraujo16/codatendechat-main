import { logger } from "../utils/logger";
import {
  markOpenTicketFallback,
  type OpenTicketFallbackFlag
} from "./openTicketRequestContext";

export type EnrichmentKind = "contactLabels" | "groupParticipantDisplay";

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err ?? "unknown");
}

function getErrorName(err: unknown): string {
  if (err && typeof err === "object" && "name" in err) {
    return String((err as { name: string }).name);
  }
  return "";
}

function getErrorStack(err: unknown): string | undefined {
  if (err instanceof Error) return err.stack;
  return undefined;
}

/** Falhas de schema/migration — enriquecimento opcional, conversa segue. */
export function isTolerableEnrichmentError(err: unknown): boolean {
  const msg = getErrorMessage(err).toLowerCase();
  const name = getErrorName(err).toLowerCase();

  if (
    name.includes("sequelize") ||
    name === "databaseerror" ||
    name === "queryfailederror"
  ) {
    return (
      msg.includes("does not exist") ||
      msg.includes("relation") ||
      msg.includes("column") ||
      msg.includes("no such table") ||
      msg.includes("missing from-clause") ||
      msg.includes("undefined column") ||
      msg.includes("invalid input syntax")
    );
  }

  return false;
}

function fallbackFlagForKind(kind: EnrichmentKind): OpenTicketFallbackFlag {
  return kind === "contactLabels" ? "labels" : "groupEnrich";
}

function logTagForKind(kind: EnrichmentKind, tolerable: boolean): string {
  if (tolerable) {
    return kind === "contactLabels"
      ? "[OpenTicket] show-ticket fallback-labels"
      : "[OpenTicket] show-ticket fallback-group-enrich";
  }
  return kind === "contactLabels"
    ? "[OpenTicket] enrichment-error-labels"
    : "[OpenTicket] enrichment-error-group-enrich";
}

/**
 * Regista falha de enriquecimento e marca fallback no contexto da request.
 * @returns true se tolerável (schema/migration); false se inesperado.
 */
export function logEnrichmentFailure(
  kind: EnrichmentKind,
  context: Record<string, unknown>,
  err: unknown
): boolean {
  const tolerable = isTolerableEnrichmentError(err);
  const payload = {
    ...context,
    enrichment: kind,
    error: getErrorMessage(err),
    errorName: getErrorName(err)
  };

  if (tolerable) {
    logger.warn(payload, logTagForKind(kind, true));
    markOpenTicketFallback(fallbackFlagForKind(kind));
  } else {
    logger.error(
      { ...payload, stack: getErrorStack(err) },
      logTagForKind(kind, false)
    );
  }

  return tolerable;
}
