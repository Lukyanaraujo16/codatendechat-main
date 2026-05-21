/**
 * Evita que MessageInput roube foco enquanto um Dialog/modal está aberto.
 */
export const isDialogOpenInDom = () => {
  if (typeof document === "undefined") return false;
  const dialogs = document.querySelectorAll('[role="dialog"]');
  for (let i = 0; i < dialogs.length; i += 1) {
    const el = dialogs[i];
    if (el.getAttribute("aria-hidden") === "true") continue;
    if (el.offsetParent !== null || el.getClientRects().length > 0) {
      return true;
    }
  }
  return false;
};

export const canAutoFocusMessageInput = ({
  transferModalOpen = false,
  quickRepliesOpen = false,
} = {}) => {
  if (transferModalOpen || quickRepliesOpen) return false;
  if (isDialogOpenInDom()) return false;
  return true;
};

export const safeFocusMessageInput = (el, blockers, source = "messageInput") => {
  if (!el || typeof el.focus !== "function") return false;
  if (!canAutoFocusMessageInput(blockers)) return false;
  // eslint-disable-next-line no-console
  console.log("[FOCUS]", source, "activeElement=", document.activeElement);
  el.focus();
  return true;
};
