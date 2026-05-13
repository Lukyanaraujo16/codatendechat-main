import { Request, Response, NextFunction } from "express";

import AppError from "../errors/AppError";
import { EffectiveModuleFlags } from "../services/CompanyService/GetEffectiveModuleFlagsService";
import { loadCompanyPlanContext } from "./loadCompanyEffectiveFeatures";
import { buildEffectiveModuleFlagsFromFeatureMap } from "../services/CompanyService/GetEffectiveModuleFlagsService";
import {
  computeEffectiveUserFeatureMapForRequest,
  USER_FEATURE_DISABLED_MSG
} from "../services/UserFeaturePermission/UserFeaturePermissionService";

const PLAN_FEATURE_DISABLED_MSG =
  "Este recurso não está disponível no seu plano.";

/**
 * Exige que o módulo legado esteja liberado (derivado do mapa granular + overrides)
 * e que o utilizador tenha permissão granular correspondente.
 */
const requireEffectiveModule = (key: keyof EffectiveModuleFlags) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const ctx = await loadCompanyPlanContext(req);
      if (!ctx) {
        return next(new AppError("ERR_NO_PERMISSION", 403));
      }
      if (!ctx.effectiveModules[key]) {
        return next(
          new AppError(
            "ERR_PLAN_FEATURE_DISABLED",
            403,
            PLAN_FEATURE_DISABLED_MSG
          )
        );
      }
      const merged = await computeEffectiveUserFeatureMapForRequest(
        req,
        ctx.featureMap
      );
      const modulesUser = buildEffectiveModuleFlagsFromFeatureMap(
        merged,
        ctx.company.modulePermissions
      );
      if (!modulesUser[key]) {
        return next(
          new AppError(
            "ERR_USER_FEATURE_DISABLED",
            403,
            USER_FEATURE_DISABLED_MSG
          )
        );
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };
};

export default requireEffectiveModule;
