import { Request } from "express";

import User from "../models/User";

/**
 * Super Admin da plataforma: não deve ser limitado por tenant, plano ou
 * `UserFeaturePermissions` nas rotas SaaS / middlewares de feature.
 *
 * Inclui `profile === "superadmin"` para contas onde a coluna `super` possa
 * não estar alinhada com o perfil de plataforma.
 */
export async function isPlatformSuperUser(req: Request): Promise<boolean> {
  if (req.user?.id == null) return false;
  const row = await User.findByPk(req.user.id, {
    attributes: ["super", "profile"]
  });
  if (!row) return false;
  return row.super === true || row.profile === "superadmin";
}
