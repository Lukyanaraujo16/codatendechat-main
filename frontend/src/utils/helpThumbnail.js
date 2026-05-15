import { getBackendBaseURL } from "../config/backendUrl";

const YOUTUBE_ID_REGEX =
  /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;

/** Categorias sugeridas no Super Admin (freeSolo permite outras). */
export const HELP_CATEGORIES = [
  "Atendimento",
  "Campanhas",
  "CRM",
  "Configurações",
  "Automação",
  "Financeiro",
  "Equipe",
  "Primeiros passos"
];

export const FILTER_ALL = "all";

export const resolveHelpVideoSource = (help) => {
  if (!help || typeof help !== "object") {
    return "";
  }
  return String(help.video || help.link || help.videoUrl || "").trim();
};

export const normalizeCategory = (record) => {
  const cat = String(record?.category || "").trim();
  return cat || "Geral";
};

export const normalizeHelpRecord = (raw) => {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const video = resolveHelpVideoSource(raw);
  const category = normalizeCategory(raw);

  return {
    ...raw,
    video,
    link: raw.link || video || "",
    category,
    thumbnailUrl: raw.thumbnailUrl || "",
    order: Number(raw.order ?? raw.helpOrder) || 0,
    isFeatured:
      raw.isFeatured === true ||
      raw.isFeatured === 1 ||
      raw.isFeatured === "1" ||
      raw.isFeatured === "true"
  };
};

export const parseHelpsList = (payload) => {
  let list = [];

  if (Array.isArray(payload)) {
    list = payload;
  } else if (payload && typeof payload === "object") {
    if (Array.isArray(payload.records)) {
      list = payload.records;
    } else if (Array.isArray(payload.helps)) {
      list = payload.helps;
    } else if (Array.isArray(payload.data)) {
      list = payload.data;
    }
  }

  return list.map(normalizeHelpRecord).filter(Boolean);
};

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
  if (!base) {
    return null;
  }

  const path = thumbnailUrl.replace(/^\//, "");
  return `${base}/public/${path}`;
};

export const resolveHelpThumbnailUrl = (help) => {
  const custom = help?.thumbnailUrl?.trim();
  if (custom) {
    return resolveUploadedThumbnailUrl(custom);
  }

  return resolveYoutubeThumbnailUrl(resolveHelpVideoSource(help));
};

export const resolveHelpEmbedUrl = (helpOrVideo) => {
  const source =
    typeof helpOrVideo === "string"
      ? helpOrVideo
      : resolveHelpVideoSource(helpOrVideo);
  const videoId = extractYoutubeVideoId(source);
  if (!videoId) {
    return null;
  }

  return `https://www.youtube.com/embed/${videoId}`;
};

export const getUniqueCategories = (records) => {
  const set = new Set();
  (records || []).forEach((record) => {
    set.add(normalizeCategory(record));
  });

  const ordered = [];
  HELP_CATEGORIES.forEach((name) => {
    if (set.has(name)) {
      ordered.push(name);
    }
  });

  const rest = [...set]
    .filter((name) => !HELP_CATEGORIES.includes(name))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  rest.forEach((name) => {
    if (!ordered.includes(name)) {
      ordered.push(name);
    }
  });

  return ordered;
};

export const groupHelpsByCategory = (records) => {
  const featured = [];
  const byCategory = {};

  (records || []).forEach((record) => {
    const category = normalizeCategory(record);

    if (record.isFeatured) {
      featured.push(record);
    } else {
      if (!byCategory[category]) {
        byCategory[category] = [];
      }
      byCategory[category].push(record);
    }
  });

  const categoryNames = getUniqueCategories(
    records.filter((r) => !r.isFeatured)
  );

  const categories = categoryNames
    .filter((name) => byCategory[name]?.length)
    .map((name) => ({
      name,
      items: byCategory[name]
    }));

  return { featured, categories };
};

export const filterHelps = (
  records,
  { search = "", category = FILTER_ALL } = {}
) => {
  let list = Array.isArray(records) ? [...records] : [];

  if (category && category !== FILTER_ALL) {
    list = list.filter(
      (record) => normalizeCategory(record) === category
    );
  }

  const query = search?.trim().toLowerCase();
  if (query) {
    list = list.filter((record) => {
      const title = (record.title || "").toLowerCase();
      const description = (record.description || "").toLowerCase();
      const cat = normalizeCategory(record).toLowerCase();
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
  const atendimento = sorted.find(
    (r) => normalizeCategory(r) === "Atendimento"
  );
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
