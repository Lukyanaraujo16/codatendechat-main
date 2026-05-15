import { getBackendBaseURL } from "../config/backendUrl";

const YOUTUBE_ID_REGEX =
  /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;

export const HELP_CATEGORIES = [
  "Atendimento",
  "Campanhas",
  "CRM",
  "Configurações",
  "Automação"
];

export const HELP_CATEGORY_ORDER = [...HELP_CATEGORIES, "Geral"];

export const extractYoutubeVideoId = (value) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const match = trimmed.match(YOUTUBE_ID_REGEX);
  return match?.[1] ?? null;
};

export const resolveYoutubeThumbnailUrl = (video, quality = "maxresdefault") => {
  const videoId = extractYoutubeVideoId(video);
  if (!videoId) {
    return null;
  }

  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
};

const resolveUploadedThumbnailUrl = (thumbnailUrl) => {
  if (!thumbnailUrl) {
    return null;
  }

  if (/^https?:\/\//i.test(thumbnailUrl)) {
    return thumbnailUrl;
  }

  const base = getBackendBaseURL();
  const path = thumbnailUrl.replace(/^\//, "");
  return `${base}/public/${path}`;
};

export const resolveHelpThumbnailUrl = (help) => {
  const custom = help?.thumbnailUrl?.trim();
  if (custom) {
    return resolveUploadedThumbnailUrl(custom);
  }

  return resolveYoutubeThumbnailUrl(help?.video);
};

export const resolveHelpEmbedUrl = (video) => {
  const videoId = extractYoutubeVideoId(video);
  if (!videoId) {
    return null;
  }

  return `https://www.youtube.com/embed/${videoId}`;
};

export const groupHelpsByCategory = (records) => {
  const featured = [];
  const byCategory = {};

  records.forEach((record) => {
    if (record.isFeatured) {
      featured.push(record);
      return;
    }

    const category =
      record.category && HELP_CATEGORIES.includes(record.category)
        ? record.category
        : "Geral";

    if (!byCategory[category]) {
      byCategory[category] = [];
    }
    byCategory[category].push(record);
  });

  const categories = HELP_CATEGORY_ORDER.filter(
    (name) => byCategory[name]?.length
  ).map((name) => ({
    name,
    items: byCategory[name]
  }));

  return { featured, categories };
};

export const FILTER_ALL = "all";

export const filterHelps = (records, { search = "", category = FILTER_ALL } = {}) => {
  let list = Array.isArray(records) ? [...records] : [];

  if (category && category !== FILTER_ALL) {
    list = list.filter((record) => {
      const cat =
        record.category && HELP_CATEGORIES.includes(record.category)
          ? record.category
          : "Geral";
      return cat === category;
    });
  }

  const query = search?.trim().toLowerCase();
  if (query) {
    list = list.filter((record) => {
      const title = (record.title || "").toLowerCase();
      const description = (record.description || "").toLowerCase();
      const cat = (record.category || "Geral").toLowerCase();
      return (
        title.includes(query) ||
        description.includes(query) ||
        cat.includes(query)
      );
    });
  }

  return list;
};

export const sortHelpsForPlayback = (records) =>
  [...(records || [])].sort((a, b) => {
    const orderA = Number(a.order) || 0;
    const orderB = Number(b.order) || 0;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return (a.title || "").localeCompare(b.title || "", undefined, {
      sensitivity: "base"
    });
  });

export const findBasicsHelp = (records) => {
  const sorted = sortHelpsForPlayback(records);
  const atendimento = sorted.find((r) => r.category === "Atendimento");
  return atendimento || sorted[0] || null;
};

const ONBOARDING_HELP_KEYWORDS = {
  whatsapp: ["whatsapp", "conex", "conectar"],
  queues: ["setor", "fila", "queue"],
  users: ["usuário", "usuario", "equipe", "time"],
  greeting: ["saudação", "saudacao", "mensagem"],
  flow: ["fluxo", "flow", "automação", "automacao"],
  firstTicket: ["atendimento", "ticket", "primeiro"]
};

export const findHelpTutorialForStep = (helps, stepId) => {
  const keywords = ONBOARDING_HELP_KEYWORDS[stepId];
  if (!keywords?.length || !Array.isArray(helps)) {
    return null;
  }

  return (
    helps.find((help) => {
      const haystack = `${help.title || ""} ${help.description || ""}`.toLowerCase();
      return keywords.some((kw) => haystack.includes(kw));
    }) || null
  );
};

export const getOnboardingStorageKey = (companyId) =>
  `atendechat-onboarding-hidden-${companyId || "default"}`;
