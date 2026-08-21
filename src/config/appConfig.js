/**
 * @fileoverview Application configuration with localStorage persistence.
 * All configurable parameters live here — no magic numbers elsewhere.
 */

const STORAGE_KEY = "hcp_settings_v1";

/** @type {AppSettings} */
const DEFAULTS = {
  // Mouse
  cursorSpeed: 1.5,
  smoothing: 0.35,         // EMA alpha (lower = smoother, higher = faster)
  pinchThreshold: 0.055,   // Normalized distance for pinch detection
  scrollSpeed: 80,         // Scroll delta multiplier
  clickDelay: 280,         // ms between double-click pulses
  mirrorCamera: true,

  // Feature toggles
  trackingEnabled: true,
  enableCursor: true,
  enableKeyboard: true,
  enableMedia: true,
  enableWindowControls: true,
  darkMode: true,

  // Gesture sensitivity (confidence minimum 0–1)
  gestureConfidenceMin: 0.75,

  // Cursor display
  showCursorOverlay: true,
};

/**
 * Load settings from localStorage, merging with defaults for missing keys.
 * @returns {AppSettings}
 */
export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

/**
 * Persist settings to localStorage.
 * @param {AppSettings} settings
 */
export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn("Failed to persist settings:", err);
  }
}

/**
 * Reset all settings to factory defaults.
 * @returns {AppSettings}
 */
export function resetSettings() {
  localStorage.removeItem(STORAGE_KEY);
  return { ...DEFAULTS };
}

export { DEFAULTS };
