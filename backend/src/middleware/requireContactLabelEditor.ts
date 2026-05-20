import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";

/** Admin, supervisor ou suporte — criar/editar etiquetas de contato. */
export default function requireContactLabelEditor(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { profile, supportMode, super: isSuper } = req.user as {
    profile?: string;
    supportMode?: boolean;
    super?: boolean;
  };

  if (isSuper === true || supportMode === true) {
    return next();
  }

  const p = String(profile || "").toLowerCase();
  if (p === "admin" || p === "supervisor") {
    return next();
  }

  throw new AppError("ERR_NO_PERMISSION", 403);
}
