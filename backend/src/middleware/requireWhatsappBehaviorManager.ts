import { NextFunction, Request, Response } from "express";
import AppError from "../errors/AppError";

/** Admin, supervisor ou super em modo suporte. */
export default function requireWhatsappBehaviorManager(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const profile = req.user?.profile;
  const support = req.user?.supportMode === true;
  if (profile === "admin" || profile === "supervisor" || support) {
    next();
    return;
  }
  next(new AppError("ERR_NO_PERMISSION", 403));
}
