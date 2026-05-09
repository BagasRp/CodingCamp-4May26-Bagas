/**
 * greeting.js — Greeting Widget module.
 * Displays the current time, date, and a time-based greeting message.
 */

/**
 * Map an hour (0–23) to a greeting string.
 *
 * @param {number} hour - Integer in the range 0–23.
 * @returns {string} One of "Good morning", "Good afternoon", "Good evening",
 *   or "Good night".
 */
export function getGreeting(hour) {
  if (hour >= 5 && hour <= 11) return 'Good morning';
  if (hour >= 12 && hour <= 17) return 'Good afternoon';
  if (hour >= 18 && hour <= 21) return 'Good evening';
  return 'Good night'; // 22–23 and 0–4
}

/**
 * Format a Date object as HH:MM.
 *
 * @param {Date} date
 * @returns {string}
 */
export function formatTime(date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Format a Date object as a human-readable date string,
 * e.g. "Monday, July 14, 2025".
 *
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Initialise the Greeting Widget inside the given container element.
 *
 * @param {HTMLElement} containerEl
 */
export function init(containerEl) {
  containerEl.innerHTML = `
    <h2 id="greeting-text" class="greeting-text"></h2>
    <p id="greeting-time" class="greeting-time"></p>
    <p id="greeting-date" class="greeting-date"></p>
  `;

  const greetingEl = containerEl.querySelector('#greeting-text');
  const timeEl     = containerEl.querySelector('#greeting-time');
  const dateEl     = containerEl.querySelector('#greeting-date');

  function tick() {
    const now = new Date();
    greetingEl.textContent = getGreeting(now.getHours());
    timeEl.textContent     = formatTime(now);
    dateEl.textContent     = formatDate(now);
  }

  tick(); // render immediately, then update every second
  setInterval(tick, 1000);
}
