const PLAY_DEBOUNCE_MS = 800;

let lastPlayAt = 0;

export function playNotificationSoundThrottled(playFn, soundType) {
  const now = Date.now();
  if (now - lastPlayAt < PLAY_DEBOUNCE_MS) {
    return Promise.resolve();
  }
  lastPlayAt = now;

  return playFn(soundType);
}
