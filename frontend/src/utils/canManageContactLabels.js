/** Admin ou supervisor — criar/editar etiquetas de contato. */
export function canManageContactLabels(user) {
  if (!user) return false;
  if (user.super === true) return true;
  if (user.supportMode === true) return true;
  const profile = String(user.profile || "").toLowerCase();
  return profile === "admin" || profile === "supervisor";
}

/** Apenas admin — excluir etiqueta da empresa. */
export function canDeleteContactLabels(user) {
  if (!user) return false;
  if (user.super === true) return true;
  if (user.supportMode === true) return true;
  return String(user.profile || "").toLowerCase() === "admin";
}
