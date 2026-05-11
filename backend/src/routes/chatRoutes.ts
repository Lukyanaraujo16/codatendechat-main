import express from "express";
import multer from "multer";
import isAuth from "../middleware/isAuth";
import requireEffectiveModule from "../middleware/requireEffectiveModule";
import { internalChatUpload } from "../config/internalChatUpload";
import AppError from "../errors/AppError";

import * as ChatController from "../controllers/ChatController";

const routes = express.Router();

routes.get("/chats", isAuth, requireEffectiveModule("useInternalChat"), ChatController.index);

routes.get("/chats/:id", isAuth, requireEffectiveModule("useInternalChat"), ChatController.show);

routes.get("/chats/:id/messages", isAuth, requireEffectiveModule("useInternalChat"), ChatController.messages);

routes.post("/chats/:id/messages", isAuth, requireEffectiveModule("useInternalChat"), ChatController.saveMessage);

routes.post(
  "/chats/:id/messages/media",
  isAuth,
  requireEffectiveModule("useInternalChat"),
  (req, res, next) => {
    internalChatUpload.single("file")(req, res, (err: any) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(new AppError("ERR_INTERNAL_CHAT_FILE_TOO_LARGE", 400));
        }
        return next(new AppError("ERR_INTERNAL_CHAT_UPLOAD_FAILED", 400));
      }
      return next(new AppError("ERR_INTERNAL_CHAT_UPLOAD_FAILED", 400));
    });
  },
  ChatController.saveMessageWithMedia
);

routes.post("/chats/:id/read", isAuth, requireEffectiveModule("useInternalChat"), ChatController.checkAsRead);

routes.post("/chats", isAuth, requireEffectiveModule("useInternalChat"), ChatController.store);

routes.put("/chats/:id", isAuth, requireEffectiveModule("useInternalChat"), ChatController.update);

routes.delete("/chats/:id", isAuth, requireEffectiveModule("useInternalChat"), ChatController.remove);

export default routes;
