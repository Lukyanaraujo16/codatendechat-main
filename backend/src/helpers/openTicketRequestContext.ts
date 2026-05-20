import { AsyncLocalStorage } from "async_hooks";
import type { ContactLabelDto } from "./getLabelsForContactIds";

/** Falhas técnicas de enriquecimento opcional — só logs, nunca banner. */
export type OpenTicketTechnicalFallback = "labels" | "groupEnrich";

/** Avisos visíveis ao operador (banner no painel). */
export type OpenTicketUserWarning =
  | "messagesPartial"
  | "ticketIncomplete";

type OpenTicketStore = {
  contactLabelsCache: Map<number, ContactLabelDto[]>;
  technicalFallbacks: Set<OpenTicketTechnicalFallback>;
  userWarnings: Set<OpenTicketUserWarning>;
  startedAt: number;
};

export const openTicketStorage = new AsyncLocalStorage<OpenTicketStore>();

export function runOpenTicketContext<T>(fn: () => T): T {
  return openTicketStorage.run(
    {
      contactLabelsCache: new Map(),
      technicalFallbacks: new Set(),
      userWarnings: new Set(),
      startedAt: Date.now()
    },
    fn
  );
}

export function getOpenTicketStore(): OpenTicketStore | undefined {
  return openTicketStorage.getStore();
}

/** Marca fallback técnico (etiquetas/grupo) — não vai para o frontend. */
export function markOpenTicketTechnicalFallback(
  flag: OpenTicketTechnicalFallback
): void {
  getOpenTicketStore()?.technicalFallbacks.add(flag);
}

/** Marca aviso relevante para o operador (banner). */
export function markOpenTicketUserWarning(
  code: OpenTicketUserWarning
): void {
  getOpenTicketStore()?.userWarnings.add(code);
}

export function getOpenTicketTechnicalFallbacks(): OpenTicketTechnicalFallback[] {
  return [...(getOpenTicketStore()?.technicalFallbacks ?? [])];
}

export function getOpenTicketElapsedMs(): number {
  const store = getOpenTicketStore();
  if (!store) return 0;
  return Date.now() - store.startedAt;
}

/** Apenas avisos que devem gerar banner no painel. */
export function getOpenTicketEnrichWarnings(): string[] {
  return [...(getOpenTicketStore()?.userWarnings ?? [])];
}

/** Detalhe técnico para logs/API em dev — nunca banner. */
export function getOpenTicketEnrichDebug(): string[] {
  const debug: string[] = [];
  const technical = getOpenTicketTechnicalFallbacks();
  if (technical.includes("labels")) {
    debug.push("labels");
  }
  if (technical.includes("groupEnrich")) {
    debug.push("groupParticipantDisplay");
  }
  return debug;
}

export function getCachedContactLabels(
  contactId: number
): ContactLabelDto[] | undefined {
  return getOpenTicketStore()?.contactLabelsCache.get(contactId);
}

export function setCachedContactLabels(
  contactId: number,
  labels: ContactLabelDto[]
): void {
  getOpenTicketStore()?.contactLabelsCache.set(contactId, labels);
}
