import { useState, useEffect, useCallback, useContext } from "react";
import api from "../../services/api";
import { AuthContext } from "../../context/Auth/AuthContext";
import {
  findHelpTutorialForStep,
  getOnboardingStorageKey
} from "../../utils/helpThumbnail";

const parseList = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.records)) {
    return payload.records;
  }
  if (Array.isArray(payload?.users)) {
    return payload.users;
  }
  return [];
};

const useOnboardingProgress = () => {
  const { user } = useContext(AuthContext);
  const [steps, setSteps] = useState({});
  const [helps, setHelps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);

  const storageKey = getOnboardingStorageKey(user?.companyId);

  useEffect(() => {
    try {
      setHidden(localStorage.getItem(storageKey) === "1");
    } catch {
      setHidden(false);
    }
  }, [storageKey]);

  const loadProgress = useCallback(async () => {
    if (user?.profile !== "admin") {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [
        whatsappRes,
        queueRes,
        usersRes,
        flowRes,
        dashboardRes,
        helpsRes
      ] = await Promise.allSettled([
        api.get("/whatsapp"),
        api.get("/queue"),
        api.get("/users", { params: { pageNumber: 1 } }),
        api.get("/flowbuilder"),
        api.get("/dashboard", { params: { days: 365 } }),
        api.get("/helps/list")
      ]);

      const whatsapps = parseList(
        whatsappRes.status === "fulfilled" ? whatsappRes.value.data : []
      );
      const queues = parseList(
        queueRes.status === "fulfilled" ? queueRes.value.data : []
      );
      const users = parseList(
        usersRes.status === "fulfilled" ? usersRes.value.data : []
      );
      const flows = parseList(
        flowRes.status === "fulfilled" ? flowRes.value.data : []
      );
      const dashboard =
        dashboardRes.status === "fulfilled" ? dashboardRes.value.data : {};
      const counters = dashboard?.counters || {};
      const helpList =
        helpsRes.status === "fulfilled" ? helpsRes.value.data : [];

      const totalTickets =
        (Number(counters.supportHappening) || 0) +
        (Number(counters.supportPending) || 0) +
        (Number(counters.supportFinished) || 0);

      const hasGreeting = queues.some(
        (q) => String(q.greetingMessage || "").trim().length > 3
      );

      setHelps(helpList);
      setSteps({
        whatsapp: whatsapps.some((w) => w.status === "CONNECTED"),
        queues: queues.length > 0,
        users: users.length > 1,
        greeting: hasGreeting,
        flow: flows.length > 0,
        firstTicket: totalTickets > 0
      });
    } catch {
      setSteps({});
    }
    setLoading(false);
  }, [user?.profile, user?.companyId]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
    setHidden(true);
  }, [storageKey]);

  const getTutorialForStep = useCallback(
    (stepId) => findHelpTutorialForStep(helps, stepId),
    [helps]
  );

  const completedCount = Object.values(steps).filter(Boolean).length;
  const totalSteps = Object.keys(steps).length;

  return {
    loading,
    steps,
    helps,
    hidden,
    dismiss,
    reload: loadProgress,
    getTutorialForStep,
    completedCount,
    totalSteps,
    isAdmin: user?.profile === "admin"
  };
};

export default useOnboardingProgress;
