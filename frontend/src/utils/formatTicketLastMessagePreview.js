import { i18n } from "../translate/i18n";

const AUDIO_LABELS = new Set(["áudio", "audio"]);
const IMAGE_LABELS = new Set(["imagem", "image", "foto", "photo"]);
const VIDEO_LABELS = new Set(["vídeo", "video"]);
const DOC_LABELS = new Set(["documento", "document", "arquivo", "file"]);

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp|svg)(\?|#|$)/i;
const VIDEO_EXT = /\.(mp4|mov|webm|mkv|avi)(\?|#|$)/i;
const AUDIO_EXT = /\.(mp3|ogg|wav|webm|m4a|aac|opus|amr)(\?|#|$)/i;
const DOC_EXT = /\.(pdf|docx?|xlsx?|pptx?|txt|csv|zip|rar|7z|odt|ods)(\?|#|$)/i;

/**
 * Formata preview da última mensagem na lista de tickets (somente UI).
 * @returns {{ text: string, isMedia: boolean, useMarkdown?: boolean }}
 */
export function formatTicketLastMessagePreview(raw) {
  if (raw == null) {
    return { text: "", isMedia: false, useMarkdown: false };
  }

  const text = String(raw).trim();
  if (!text) {
    return { text: "", isMedia: false, useMarkdown: false };
  }

  if (
    text.includes("data:image/png;base64") ||
    text.includes("maps.google.com/maps")
  ) {
    return {
      text: i18n.t("ticketsListItem.preview.location"),
      isMedia: true,
      useMarkdown: false,
    };
  }

  const lower = text.toLowerCase();
  const firstToken = lower.split(/\s+/)[0]?.replace(/[^\wáàâãéêíóôõúç]/gi, "") || lower;

  if (AUDIO_LABELS.has(lower) || AUDIO_LABELS.has(firstToken) || AUDIO_EXT.test(text)) {
    return {
      text: i18n.t("ticketsListItem.preview.audio"),
      isMedia: true,
      useMarkdown: false,
    };
  }

  if (
    IMAGE_LABELS.has(lower) ||
    lower === "sticker" ||
    IMAGE_EXT.test(text) ||
    /\/public\/[^\s]*\.(jpe?g|png|gif|webp)/i.test(text)
  ) {
    return {
      text: i18n.t("ticketsListItem.preview.image"),
      isMedia: true,
      useMarkdown: false,
    };
  }

  if (VIDEO_LABELS.has(lower) || VIDEO_EXT.test(text)) {
    return {
      text: i18n.t("ticketsListItem.preview.video"),
      isMedia: true,
      useMarkdown: false,
    };
  }

  if (
    DOC_LABELS.has(lower) ||
    DOC_EXT.test(text) ||
    /\/public\/[^\s]*\.(pdf|doc|xls|ppt|zip)/i.test(text)
  ) {
    return {
      text: i18n.t("ticketsListItem.preview.document"),
      isMedia: true,
      useMarkdown: false,
    };
  }

  if (lower === "arquivo de mídia" || lower === "arquivo de midia") {
    return {
      text: i18n.t("ticketsListItem.preview.media"),
      isMedia: true,
      useMarkdown: false,
    };
  }

  return { text, isMedia: false, useMarkdown: true };
}
