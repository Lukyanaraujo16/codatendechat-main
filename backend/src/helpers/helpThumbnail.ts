const YOUTUBE_ID_REGEX =
  /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;

export const extractYoutubeVideoId = (value?: string | null): string | null => {
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

export const resolveYoutubeThumbnailUrl = (
  video?: string | null,
  quality: "maxresdefault" | "hqdefault" = "maxresdefault"
): string | null => {
  const videoId = extractYoutubeVideoId(video);
  if (!videoId) {
    return null;
  }

  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
};

export const resolveHelpThumbnailUrl = (help: {
  thumbnailUrl?: string | null;
  video?: string | null;
}): string | null => {
  const custom = help.thumbnailUrl?.trim();
  if (custom) {
    return custom;
  }

  return resolveYoutubeThumbnailUrl(help.video);
};
