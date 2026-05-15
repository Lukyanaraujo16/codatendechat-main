type DeleteTicketUser = {
  profile?: string;
  supportMode?: boolean;
};

/** Admin, supervisor ou support mode podem excluir tickets. */
export function userCanDeleteTicket(user: DeleteTicketUser): boolean {
  if (user.supportMode === true) return true;
  const profile = user.profile;
  return profile === "admin" || profile === "supervisor";
}
