import { alpha } from "@material-ui/core/styles";

export const PANEL_RADIUS = 14;
export const PANEL_GAP_PX = 12;
/** Padding lateral padrão da coluna de lista (busca, bulk, cards). */
export const LIST_SIDE_PADDING_PX = 12;

/** Sombra padrão dos painéis principais (lista + conversa). */
export function getPanelElevation(theme) {
  return theme.palette.type === "dark"
    ? "0 1px 2px rgba(0,0,0,0.3), 0 6px 18px rgba(0,0,0,0.4)"
    : "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)";
}

/** Divisão sutil entre lista e conversa (aplicar em um lado apenas). */
export function getPanelDividerBorder(theme) {
  return `1px solid ${alpha(theme.palette.divider, 0.6)}`;
}

/** Gradiente ultra sutil no painel da conversa. */
export function getChatPanelBackground(theme) {
  const paper = theme.palette.background.paper;
  return theme.palette.type === "dark"
    ? `linear-gradient(180deg, ${paper} 0%, ${alpha(theme.palette.success.main, 0.03)} 100%)`
    : `linear-gradient(180deg, ${paper} 0%, ${alpha(theme.palette.success.main, 0.02)} 100%)`;
}

/** Scrollbar discreta para listas de tickets. */
export function getTicketPanelScrollbarStyles(theme) {
  return {
    "&::-webkit-scrollbar": {
      width: 6,
      height: 6,
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: alpha(theme.palette.text.primary, 0.2),
      borderRadius: 10,
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: "transparent",
    },
  };
}

export function getCardListHoverBackground(theme) {
  return alpha(theme.palette.action.hover, 0.6);
}
