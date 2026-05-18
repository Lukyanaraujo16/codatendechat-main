import path from "path";

export type CompanyMediaBucket = "image" | "video" | "audio" | "document" | "other";

export type CompanyMediaSource =
  | "message"
  | "quickMessage"
  | "schedule"
  | "campaign"
  | "announcement"
  | "fileListOption"
  | "chatMessage"
  | "flowImage"
  | "flowAudio";

const IMAGE_EXT = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "svg",
  "ico"
]);
const VIDEO_EXT = new Set(["mp4", "webm", "mov", "mkv", "avi"]);
const AUDIO_EXT = new Set(["mp3", "ogg", "opus", "wav", "m4a", "aac", "amr"]);
const DOC_EXT = new Set(["pdf", "doc", "docx", "xls", "xlsx", "csv", "txt", "odt", "ppt", "pptx"]);

export function extFromName(fileName: string): string {
  const base = path.basename(String(fileName || ""));
  const dot = base.lastIndexOf(".");
  if (dot < 0 || dot === base.length - 1) return "";
  return base.slice(dot + 1).toLowerCase();
}

export function classifyMediaBucket(
  mimeType: string | null | undefined,
  fileName: string
): CompanyMediaBucket {
  const mt = String(mimeType || "").toLowerCase();
  if (mt.startsWith("image/")) return "image";
  if (mt.startsWith("video/")) return "video";
  if (mt.startsWith("audio/")) return "audio";
  if (
    mt.includes("pdf") ||
    mt.includes("word") ||
    mt.includes("sheet") ||
    mt.includes("excel") ||
    mt.includes("text") ||
    mt.includes("msword")
  ) {
    return "document";
  }
  const ext = extFromName(fileName);
  if (IMAGE_EXT.has(ext)) return "image";
  if (VIDEO_EXT.has(ext)) return "video";
  if (AUDIO_EXT.has(ext)) return "audio";
  if (DOC_EXT.has(ext)) return "document";
  return "other";
}

export function normalizePublicRelPath(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s) return null;
  s = s.replace(/\\/g, "/");
  const publicIdx = s.toLowerCase().indexOf("/public/");
  if (publicIdx >= 0) {
    s = s.slice(publicIdx + "/public/".length);
  } else if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      const p = u.pathname.replace(/^\/+/, "");
      s = p.startsWith("public/") ? p.slice("public/".length) : p;
    } catch {
      return null;
    }
  }
  s = s.replace(/^\/+/, "");
  return s || null;
}
