import { Request, Response, NextFunction } from "express";
import { runOpenTicketContext } from "../helpers/openTicketRequestContext";

/**
 * Contexto por request para cache de etiquetas e métricas de abertura de conversa.
 * Deve envolver rotas GET /tickets/u/:uuid e GET /messages/:ticketId.
 */
export default function openTicketContextMiddleware(
  _req: Request,
  _res: Response,
  next: NextFunction
): void {
  runOpenTicketContext(() => {
    next();
  });
}
