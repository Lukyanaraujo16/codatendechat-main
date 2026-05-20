import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";

/** Admin ou suporte — excluir etiquetas de contato. */
export default function requireContactLabelAdmin(
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

  if (String(profile || "").toLowerCase() === "admin") {
    return next();
  }

  throw new AppError("ERR_NO_PERMISSION", 403);
}
