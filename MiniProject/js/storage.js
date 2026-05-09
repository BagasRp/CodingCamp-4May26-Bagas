/**
 * storage.js — thin wrapper around localStorage.
 *
 * Provides typed load/save helpers so widget modules never call
 * localStorage directly. All JSON serialisation and error handling
 * is centralised here.
 */

/**
 * Load and deserialise a value from localStorage.
 *
 * @param {string} key - The localStorage key to read.
 * @param {*} [fallback=[]] - Value returned when the key is absent or the
 *   stored value is not valid JSON.
 * @returns {*} The parsed value, or `fallback` on any error.
 */
export function load(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    // Corrupt JSON or localStorage unavailable — return the safe fallback.
    return fallback;
  }
}

/**
 * Serialise and persist a value to localStorage.
 *
 * On QuotaExceededError or any other exception the error is swallowed and a
 * console warning is emitted so the UI can continue to function in-memory for
 * the current session.
 *
 * @param {string} key - The localStorage key to write.
 * @param {*} value - The value to serialise and store.
 */
export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // QuotaExceededError, SecurityError (private browsing), or any other
    // storage failure — log a warning and continue without throwing.
    console.warn(`[storage] Failed to save key "${key}":`, err);
  }
}
