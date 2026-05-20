import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import alertSound from "../../assets/sound.mp3";
import notifySound from "../../assets/chat_notify.mp3";
import { getNotificationSoundType } from "../../utils/getNotificationSoundType";
import {
  persistOpenConversationEnabled,
  readOpenConversationEnabled,
} from "../../utils/notificationSoundOpenConversation";
import { playNotificationSoundThrottled } from "../../utils/notificationSoundPlayback";

const STORAGE_VOLUME = "notificationSoundVolume";
const STORAGE_MUTED = "notificationSoundMuted";
/** Chave legada usada antes do contexto centralizado */
const LEGACY_VOLUME_KEY = "volume";

/** Volume relativo para som discreto na conversa aberta (mesmo arquivo que newMessage). */
const OPEN_CONVERSATION_VOLUME_SCALE = 0.45;

export const NOTIFICATION_SOUND_TYPES = {
  newMessage: "newMessage",
  openConversationMessage: "openConversationMessage",
  internalChat: "internalChat",
  default: "default",
};

const SOUND_SRC = {
  [NOTIFICATION_SOUND_TYPES.newMessage]: alertSound,
  [NOTIFICATION_SOUND_TYPES.openConversationMessage]: alertSound,
  [NOTIFICATION_SOUND_TYPES.internalChat]: notifySound,
  [NOTIFICATION_SOUND_TYPES.default]: alertSound,
};

const SOUND_VOLUME_SCALE = {
  [NOTIFICATION_SOUND_TYPES.openConversationMessage]:
    OPEN_CONVERSATION_VOLUME_SCALE,
};

function clampVolume(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  return Math.min(1, Math.max(0, n));
}

function readStoredVolume() {
  const raw =
    localStorage.getItem(STORAGE_VOLUME) ??
    localStorage.getItem(LEGACY_VOLUME_KEY);
  return clampVolume(raw);
}

function readStoredMuted() {
  const flag = localStorage.getItem(STORAGE_MUTED);
  if (flag === "true") return true;
  if (flag === "false") return false;
  return readStoredVolume() === 0;
}

function persistSoundPrefs(volume, muted) {
  const v = clampVolume(volume);
  localStorage.setItem(STORAGE_VOLUME, String(v));
  localStorage.setItem(STORAGE_MUTED, muted ? "true" : "false");
  localStorage.setItem(LEGACY_VOLUME_KEY, String(v));
}

const NotificationSoundContext = createContext(null);

export function NotificationSoundProvider({ children }) {
  const [volume, setVolumeState] = useState(readStoredVolume);
  const [muted, setMutedState] = useState(readStoredMuted);
  const [openConversationEnabled, setOpenConversationEnabledState] = useState(
    readOpenConversationEnabled
  );

  const effectiveVolume = muted ? 0 : volume;

  const setVolume = useCallback((next) => {
    const v = clampVolume(next);
    setVolumeState(v);
    const m = v === 0;
    setMutedState(m);
    persistSoundPrefs(v, m);
  }, []);

  const setMuted = useCallback(
    (next) => {
      const m = Boolean(next);
      setMutedState(m);
      persistSoundPrefs(volume, m);
    },
    [volume]
  );

  const toggleMuted = useCallback(() => {
    setMutedState((prev) => {
      const next = !prev;
      persistSoundPrefs(volume, next);
      return next;
    });
  }, [volume]);

  const setOpenConversationEnabled = useCallback((enabled) => {
    const next = Boolean(enabled);
    setOpenConversationEnabledState(next);
    persistOpenConversationEnabled(next);
  }, []);

  const playNotificationSound = useCallback(
    (soundType = NOTIFICATION_SOUND_TYPES.default) => {
      if (muted || effectiveVolume <= 0) {
        return Promise.resolve();
      }

      const src = SOUND_SRC[soundType] || SOUND_SRC.default;
      const audio = new Audio(src);
      const scale = SOUND_VOLUME_SCALE[soundType] ?? 1;
      audio.volume = effectiveVolume * scale;

      return audio.play().catch((err) => {
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.debug("[NotificationSound] play blocked or failed", err);
        }
      });
    },
    [muted, effectiveVolume]
  );

  const playContextualNotificationSound = useCallback(
    ({ ticketId, ticketUuid, route } = {}) => {
      if (muted || effectiveVolume <= 0) {
        return Promise.resolve();
      }

      const pathname =
        route ||
        (typeof window !== "undefined" ? window.location.pathname : "");

      const soundType = getNotificationSoundType({
        route: pathname,
        incomingTicket: { id: ticketId, uuid: ticketUuid },
      });

      if (
        soundType === NOTIFICATION_SOUND_TYPES.openConversationMessage &&
        !openConversationEnabled
      ) {
        return Promise.resolve();
      }

      return playNotificationSoundThrottled(
        playNotificationSound,
        soundType
      );
    },
    [
      muted,
      effectiveVolume,
      openConversationEnabled,
      playNotificationSound,
    ]
  );

  const value = useMemo(
    () => ({
      volume,
      muted,
      effectiveVolume,
      openConversationEnabled,
      setVolume,
      setMuted,
      toggleMuted,
      setOpenConversationEnabled,
      playNotificationSound,
      playContextualNotificationSound,
    }),
    [
      volume,
      muted,
      effectiveVolume,
      openConversationEnabled,
      setVolume,
      setMuted,
      toggleMuted,
      setOpenConversationEnabled,
      playNotificationSound,
      playContextualNotificationSound,
    ]
  );

  return (
    <NotificationSoundContext.Provider value={value}>
      {children}
    </NotificationSoundContext.Provider>
  );
}

export function useNotificationSound() {
  const ctx = useContext(NotificationSoundContext);
  if (!ctx) {
    throw new Error(
      "useNotificationSound must be used within NotificationSoundProvider"
    );
  }
  return ctx;
}

export default NotificationSoundContext;
