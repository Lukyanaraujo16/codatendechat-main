/** Apenas admin (ou super/support) pode alterar responsáveis de contatos. */
export function canManageContactAssignments(user) {
  if (!user) return false;
  if (user.super === true || user.supportMode === true) return true;
  return String(user.profile || "") === "admin";
}

export default canManageContactAssignments;
