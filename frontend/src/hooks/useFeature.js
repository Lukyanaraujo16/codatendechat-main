import usePlanFlags from "./usePlanFlags";

/**
 * Feature granular do plano (ex.: "automation.openai").
 * Respeita effectiveFeatures da API + override false em modulePermissions da empresa.
 *
 * Enquanto `loaded`/`ready` for false, `enabled` fica false por omissão — não trate como bloqueio
 * de plano até `loaded` ser true (use loading ou não renderize `PlanFeatureBlocked`).
 *
 * @param {string} featureKey
 * @returns {{ enabled: boolean, loaded: boolean, ready: boolean }}
 */
export default function useFeature(featureKey) {
  const { effectiveFeatures, loaded } = usePlanFlags();
  const enabled = loaded ? effectiveFeatures[featureKey] === true : false;
  return { enabled, loaded, ready: loaded };
}
