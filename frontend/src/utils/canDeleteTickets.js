import rules from "../rules";

const check = (role, action) => {
  const permissions = rules[role];
  if (!permissions) return false;
  const staticPermissions = permissions.static;
  return Boolean(staticPermissions && staticPermissions.includes(action));
};

/** Admin, supervisor, support mode ou regra estática ticket-options:deleteTicket. */
export function canDeleteTickets(user) {
  if (!user) return false;
  if (user.supportMode === true) return true;
  const profile = user.profile;
  if (profile === "admin" || profile === "supervisor") return true;
  return check(profile, "ticket-options:deleteTicket");
}
