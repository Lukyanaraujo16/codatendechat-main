/**
 * Métricas internas de notificações (console estruturado, sem analytics externo).
 */
export function logNotificationMetric(event, payload = {}) {
  const entry = {
    event,
    at: new Date().toISOString(),
    ...payload,
  };

  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.info("[notification_metrics]", entry);
  } else {
    // eslint-disable-next-line no-console
    console.log("[notification_metrics]", JSON.stringify(entry));
  }
}
