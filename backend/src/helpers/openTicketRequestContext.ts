import { AsyncLocalStorage } from "async_hooks";
import type { ContactLabelDto } from "./getLabelsForContactIds";

export type OpenTicketFallbackFlag = "labels" | "groupEnrich";

type OpenTicketStore = {
  contactLabelsCache: Map<number, ContactLabelDto[]>;
  fallbacks: Set<OpenTicketFallbackFlag>;
  startedAt: number;
};

export const openTicketStorage = new AsyncLocalStorage<OpenTicketStore>();

export function runOpenTicketContext<T>(fn: () => T): T {
  return openTicketStorage.run(
    {
      contactLabelsCache: new Map(),
      fallbacks: new Set(),
      startedAt: Date.now()
    },
    fn
  );
}

export function getOpenTicketStore(): OpenTicketStore | undefined {
  return openTicketStorage.getStore();
}

export function markOpenTicketFallback(flag: OpenTicketFallbackFlag): void {
  getOpenTicketStore()?.fallbacks.add(flag);
}

export function getOpenTicketFallbacks(): OpenTicketFallbackFlag[] {
  return [...(getOpenTicketStore()?.fallbacks ?? [])];
}

export function getOpenTicketElapsedMs(): number {
  const store = getOpenTicketStore();
  if (!store) return 0;
  return Date.now() - store.startedAt;
}

/** Flags de fallback expostas ao cliente (painel parcial). */
export function getOpenTicketEnrichWarnings(): string[] {
  const warnings: string[] = [];
  const fallbacks = getOpenTicketFallbacks();
  if (fallbacks.includes("labels")) {
    warnings.push("labels");
  }
  if (fallbacks.includes("groupEnrich")) {
    warnings.push("groupParticipantDisplay");
  }
  return warnings;
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
