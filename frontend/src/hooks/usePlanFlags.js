import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/Auth/AuthContext";
import usePlans from "./usePlans";
import { buildEffectiveModuleFlagsFromFeatureMap } from "../components/ModuleSettings/moduleSync";

/**
 * Flags de plano (legado) + mapa granular `effectiveFeatures` (chaves config/features),
 * refinado com `user.effectiveUserFeatures` quando existir (backend já aplica plano ∧ utilizador).
 */
export default function usePlanFlags() {
  const { user } = useContext(AuthContext);
  const { getPlanCompany } = usePlans();
  const [flags, setFlags] = useState({
    useCampaigns: false,
    useFlowbuilders: false,
    useKanban: false,
    useOpenAi: false,
    useIntegrations: false,
    useSchedules: false,
    useExternalApi: false,
    useGroups: true,
    useInternalChat: true,
    loaded: false,
    /** Só o teto do plano (sem camada de utilizador). */
    planTierEffectiveFeatures: {},
    effectiveFeatures: {},
  });

  useEffect(() => {
    if (!user?.companyId) {
      setFlags((f) => ({
        ...f,
        loaded: true,
        effectiveFeatures: {},
        planTierEffectiveFeatures: {},
      }));
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const planConfigs = await getPlanCompany(undefined, user.companyId);
        if (cancelled) return;
        const p = planConfigs?.plan;
        const eff = planConfigs?.effectiveModules;
        const planEffectiveFeatures = planConfigs?.effectiveFeatures || {};
        const userFx = user?.effectiveUserFeatures;
        const hasUserFx =
          userFx &&
          typeof userFx === "object" &&
          Object.keys(userFx).length > 0;
        const effectiveFeatures = hasUserFx ? userFx : planEffectiveFeatures;
        const modulePerms = user?.company?.modulePermissions;
        const effFromFeatures = hasUserFx
          ? buildEffectiveModuleFlagsFromFeatureMap(
              effectiveFeatures,
              modulePerms ?? {}
            )
          : null;
        if (!p) {
          setFlags({
            useCampaigns: false,
            useFlowbuilders: false,
            useKanban: false,
            useOpenAi: false,
            useIntegrations: false,
            useSchedules: false,
            useExternalApi: false,
            useGroups: true,
            useInternalChat: false,
            loaded: true,
            planTierEffectiveFeatures: planEffectiveFeatures,
            effectiveFeatures,
          });
          return;
        }
        if (effFromFeatures) {
          setFlags({
            useCampaigns: !!effFromFeatures.useCampaigns,
            useFlowbuilders: !!effFromFeatures.useFlowbuilders,
            useKanban: !!effFromFeatures.useKanban,
            useOpenAi: !!effFromFeatures.useOpenAi,
            useIntegrations: !!effFromFeatures.useIntegrations,
            useSchedules: !!effFromFeatures.useSchedules,
            useExternalApi: !!effFromFeatures.useExternalApi,
            useGroups: effFromFeatures.useGroups !== false,
            useInternalChat: !!effFromFeatures.useInternalChat,
            loaded: true,
            planTierEffectiveFeatures: planEffectiveFeatures,
            effectiveFeatures,
          });
          return;
        }
        if (eff) {
          setFlags({
            useCampaigns: !!eff.useCampaigns,
            useFlowbuilders: !!eff.useFlowbuilders,
            useKanban: !!eff.useKanban,
            useOpenAi: !!eff.useOpenAi,
            useIntegrations: !!eff.useIntegrations,
            useSchedules: !!eff.useSchedules,
            useExternalApi: !!eff.useExternalApi,
            useGroups: eff.useGroups !== false,
            useInternalChat:
              eff.useInternalChat !== undefined
                ? !!eff.useInternalChat
                : p.useInternalChat !== false,
            loaded: true,
            planTierEffectiveFeatures: planEffectiveFeatures,
            effectiveFeatures,
          });
        } else {
          setFlags({
            useCampaigns: !!p.useCampaigns,
            useFlowbuilders: !!p.useCampaigns,
            useKanban: !!p.useKanban,
            useOpenAi: !!p.useOpenAi,
            useIntegrations: !!p.useIntegrations,
            useSchedules: !!p.useSchedules,
            useExternalApi: !!p.useExternalApi,
            useGroups: true,
            useInternalChat: p.useInternalChat !== false,
            loaded: true,
            planTierEffectiveFeatures: planEffectiveFeatures,
            effectiveFeatures,
          });
        }
      } catch {
        if (!cancelled) setFlags((f) => ({ ...f, loaded: true }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    user?.companyId,
    user?.effectiveUserFeatures,
    user?.company?.modulePermissions,
    getPlanCompany,
  ]);

  useEffect(() => {
    if (localStorage.getItem("cshow")) {
      setFlags((f) => ({
        ...f,
        useCampaigns: true,
        useFlowbuilders: true,
        effectiveFeatures: {
          ...f.effectiveFeatures,
          "campaigns.sends": true,
          "campaigns.lists": true,
          "automation.chatbot": true,
          "automation.keywords": true,
        },
      }));
    }
  }, []);

  return {
    ...flags,
    /** Alias explícito: permissões/features do plano já foram carregadas da API. */
    ready: flags.loaded,
  };
}
