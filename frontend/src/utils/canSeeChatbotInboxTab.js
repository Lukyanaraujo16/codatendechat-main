/**
 * Aba "Chatbot" na inbox de atendimentos — visível só para perfis elevados.
 */
export function canSeeChatbotInboxTab(user) {
  if (!user) return false;
  if (user.super === true) return true;
  if (user.supportMode === true) return true;
  const profile = String(user.profile || "").toLowerCase();
  return profile === "admin" || profile === "supervisor";
}
