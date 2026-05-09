/**
 * timer.js — Focus Timer module.
 * Implements a 25-minute (1500-second) Pomodoro countdown timer.
 */

/**
 * Convert an integer number of seconds (0–1500) to a zero-padded MM:SS string.
 *
 * @param {number} seconds - Integer in the range 0–1500.
 * @returns {string} e.g. "25:00", "04:59", "00:00"
 */
export function formatTime(seconds) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

/**
 * Initialise the Focus Timer widget inside the given container element.
 *
 * @param {HTMLElement} containerEl
 */
export function init(containerEl) {
  // In-memory state
  const state = {
    remaining: 1500,
    running: false,
    intervalId: null,
  };

  // Build DOM
  containerEl.innerHTML = `
    <h2>Focus Timer</h2>
    <div class="timer-display" id="timer-display" aria-live="polite" aria-atomic="true">
      ${formatTime(state.remaining)}
    </div>
    <div class="timer-status" id="timer-status" aria-live="polite"></div>
    <div class="timer-controls">
      <button class="btn btn-primary" id="timer-start">Start</button>
      <button class="btn btn-secondary" id="timer-stop" disabled>Stop</button>
      <button class="btn btn-secondary" id="timer-reset">Reset</button>
    </div>
  `;

  const displayEl = containerEl.querySelector('#timer-display');
  const statusEl  = containerEl.querySelector('#timer-status');
  const startBtn  = containerEl.querySelector('#timer-start');
  const stopBtn   = containerEl.querySelector('#timer-stop');
  const resetBtn  = containerEl.querySelector('#timer-reset');

  function updateDisplay() {
    displayEl.textContent = formatTime(state.remaining);
  }

  function updateButtons() {
    startBtn.disabled = state.running;
    stopBtn.disabled  = !state.running;
  }

  function start() {
    if (state.running) return;
    state.running = true;
    statusEl.textContent = '';
    containerEl.classList.remove('timer-ended');
    updateButtons();

    state.intervalId = setInterval(() => {
      state.remaining -= 1;
      updateDisplay();

      if (state.remaining <= 0) {
        clearInterval(state.intervalId);
        state.intervalId = null;
        state.running = false;
        statusEl.textContent = 'Session ended!';
        containerEl.classList.add('timer-ended');
        updateButtons();
      }
    }, 1000);
  }

  function stop() {
    if (!state.running) return;
    clearInterval(state.intervalId);
    state.intervalId = null;
    state.running = false;
    updateButtons();
  }

  function reset() {
    stop();
    state.remaining = 1500;
    statusEl.textContent = '';
    containerEl.classList.remove('timer-ended');
    updateDisplay();
    updateButtons();
  }

  startBtn.addEventListener('click', start);
  stopBtn.addEventListener('click', stop);
  resetBtn.addEventListener('click', reset);
}
