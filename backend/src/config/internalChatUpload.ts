import path from "path";
import fs from "fs";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import uploadConfig from "./upload";

const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

const ALLOWED_MIME = new Set([
  // images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  // video
  "video/mp4",
  "video/webm",
  "video/quicktime",
  // audio
  "audio/mpeg",
  "audio/mp3",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/mp4",
  "audio/aac",
  // docs
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]);

function safeBaseName(original: string): string {
  const base = path.basename(String(original || ""), path.extname(String(original || "")));
  return base
    .replace(/[^\w.\- ]+/g, "_")
    .trim()
    .slice(0, 80);
}

const publicRoot = uploadConfig.directory;

export const internalChatUpload = multer({
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!file?.mimetype || !ALLOWED_MIME.has(file.mimetype)) {
      // Multer não suporta AppError aqui com tipagem forte; usamos uma flag no req
      (_req as any).fileValidationError = "ERR_INTERNAL_CHAT_FILE_TYPE_NOT_ALLOWED";
      return cb(null, false);
    }
    return cb(null, true);
  },
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const companyId = (req as any)?.user?.companyId;
      const folder = path.resolve(publicRoot, "internal-chat", String(companyId || "unknown"));
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
      }
      return cb(null, folder);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "").slice(0, 16) || "";
      const base = safeBaseName(file.originalname);
      const name = `${Date.now()}_${uuidv4()}_${base}${ext}`;
      return cb(null, name);
    }
  })
});

export const INTERNAL_CHAT_MAX_SIZE_BYTES = MAX_SIZE_BYTES;

