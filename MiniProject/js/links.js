/**
 * links.js — Quick Links module.
 * Manages a panel of user-defined shortcut buttons that open URLs in a new tab.
 * All state is persisted to localStorage via storage.js.
 */

import { load, save } from './storage.js';

const STORAGE_KEY = 'links';

/** @type {Array<{id: string, label: string, url: string}>} */
let links = [];

/** @type {HTMLElement|null} */
let containerEl = null;

/** @type {HTMLDivElement|null} */
let linksPanelEl = null;

/** @type {HTMLInputElement|null} */
let labelInputEl = null;

/** @type {HTMLInputElement|null} */
let urlInputEl = null;

/** @type {HTMLElement|null} */
let labelValidationEl = null;

/** @type {HTMLElement|null} */
let urlValidationEl = null;

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Generate a unique id using crypto.randomUUID when available, falling back
 * to Date.now() + a random suffix to reduce collision risk.
 *
 * @returns {string}
 */
function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Validate a URL string using the browser's URL constructor.
 * Returns true if the string is a valid URL, false otherwise.
 *
 * @param {string} value
 * @returns {boolean}
 */
function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch (e) {
    // TypeError means invalid URL
    return false;
  }
}

// ─── Rendering ──────────────────────────────────────────────────────────────

/**
 * Clear and re-render the links panel from the in-memory `links` array.
 * Each link is a button that opens link.url in a new tab.
 * Each link item also includes a delete button.
 *
 * Requirements: 8.4, 8.5
 */
function renderLinks() {
  if (!linksPanelEl) return;

  linksPanelEl.innerHTML = '';

  if (links.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'links-empty';
    empty.textContent = 'No links yet. Add one above!';
    linksPanelEl.appendChild(empty);
    return;
  }

  links.forEach((link) => {
    const item = document.createElement('div');
    item.className = 'links-item';
    item.dataset.id = link.id;

    // ── Link button — opens URL in a new tab (Requirement 8.4) ────────────
    const linkBtn = document.createElement('button');
    linkBtn.type = 'button';
    linkBtn.className = 'btn links-btn';
    linkBtn.textContent = link.label;
    linkBtn.setAttribute('aria-label', `Open ${link.label} in a new tab`);
    linkBtn.addEventListener('click', () => {
      window.open(link.url, '_blank');
    });

    // ── Delete button (Requirement 8.5) ───────────────────────────────────
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn-danger links-delete';
    deleteBtn.textContent = 'Delete';
    deleteBtn.setAttribute('aria-label', `Delete link: ${link.label}`);
    deleteBtn.addEventListener('click', () => handleDelete(link.id));

    item.appendChild(linkBtn);
    item.appendChild(deleteBtn);
    linksPanelEl.appendChild(item);
  });
}

// ─── Action handlers ─────────────────────────────────────────────────────────

/**
 * Handle add-link form submission.
 * Validates label (non-empty) and URL (valid per new URL()).
 * On success: pushes to links, saves, re-renders.
 * On failure: shows inline validation messages.
 *
 * Requirements: 8.1, 8.2, 8.3
 *
 * @param {Event} e
 */
function handleAdd(e) {
  e.preventDefault();

  const label = labelInputEl.value.trim();
  const url = urlInputEl.value.trim();

  let valid = true;

  if (!label) {
    labelValidationEl.textContent = 'Label cannot be empty.';
    valid = false;
  } else {
    labelValidationEl.textContent = '';
  }

  if (!url) {
    urlValidationEl.textContent = 'URL cannot be empty.';
    valid = false;
  } else if (!isValidUrl(url)) {
    urlValidationEl.textContent = 'Please enter a valid URL (e.g. https://example.com).';
    valid = false;
  } else {
    urlValidationEl.textContent = '';
  }

  if (!valid) return;

  const newLink = {
    id: generateId(),
    label,
    url,
  };

  links.push(newLink);
  save(STORAGE_KEY, links);
  renderLinks();

  labelInputEl.value = '';
  urlInputEl.value = '';
  labelValidationEl.textContent = '';
  urlValidationEl.textContent = '';
  labelInputEl.focus();
}

/**
 * Delete the link with the given id.
 * Removes from in-memory array, saves, and re-renders.
 *
 * Requirements: 8.6
 *
 * @param {string} id
 */
function handleDelete(id) {
  links = links.filter((l) => l.id !== id);
  save(STORAGE_KEY, links);
  renderLinks();
}

// ─── Init ────────────────────────────────────────────────────────────────────

/**
 * Initialise the Quick Links widget inside the given container element.
 * Loads persisted links from storage, renders the add-link form and links panel.
 *
 * Requirements: 9.2, 9.3
 *
 * @param {HTMLElement} el
 */
export function init(el) {
  containerEl = el;

  // Task 6.1 — load links from storage into in-memory array (Requirements 9.2, 9.3)
  links = load(STORAGE_KEY, []);

  // ── Build widget structure ───────────────────────────────────────────────
  containerEl.innerHTML = '';

  const heading = document.createElement('h2');
  heading.textContent = 'Quick Links';
  containerEl.appendChild(heading);

  // ── Add-link form (Task 6.3 — Requirements 8.1, 8.2, 8.3) ───────────────
  const form = document.createElement('form');
  form.className = 'links-form';
  form.setAttribute('aria-label', 'Add new link');
  form.noValidate = true;

  // Label field
  const labelGroup = document.createElement('div');
  labelGroup.className = 'links-field-group';

  labelInputEl = document.createElement('input');
  labelInputEl.type = 'text';
  labelInputEl.className = 'links-label-input';
  labelInputEl.placeholder = 'Label (e.g. GitHub)';
  labelInputEl.setAttribute('aria-label', 'Link label');
  labelInputEl.setAttribute('autocomplete', 'off');

  labelValidationEl = document.createElement('span');
  labelValidationEl.className = 'validation-msg links-label-validation';
  labelValidationEl.setAttribute('aria-live', 'polite');

  // Clear label validation when user starts typing
  labelInputEl.addEventListener('input', () => {
    labelValidationEl.textContent = '';
  });

  labelGroup.appendChild(labelInputEl);
  labelGroup.appendChild(labelValidationEl);

  // URL field
  const urlGroup = document.createElement('div');
  urlGroup.className = 'links-field-group';

  urlInputEl = document.createElement('input');
  urlInputEl.type = 'url';
  urlInputEl.className = 'links-url-input';
  urlInputEl.placeholder = 'URL (e.g. https://github.com)';
  urlInputEl.setAttribute('aria-label', 'Link URL');
  urlInputEl.setAttribute('autocomplete', 'off');

  urlValidationEl = document.createElement('span');
  urlValidationEl.className = 'validation-msg links-url-validation';
  urlValidationEl.setAttribute('aria-live', 'polite');

  // Clear URL validation when user starts typing
  urlInputEl.addEventListener('input', () => {
    urlValidationEl.textContent = '';
  });

  urlGroup.appendChild(urlInputEl);
  urlGroup.appendChild(urlValidationEl);

  // Submit button
  const addBtn = document.createElement('button');
  addBtn.type = 'submit';
  addBtn.className = 'btn btn-primary links-add-btn';
  addBtn.textContent = 'Add Link';

  form.appendChild(labelGroup);
  form.appendChild(urlGroup);
  form.appendChild(addBtn);
  form.addEventListener('submit', handleAdd);
  containerEl.appendChild(form);

  // ── Links panel (Task 6.2 — Requirements 8.4, 8.5) ───────────────────────
  linksPanelEl = document.createElement('div');
  linksPanelEl.className = 'links-panel';
  linksPanelEl.setAttribute('aria-label', 'Quick links');
  containerEl.appendChild(linksPanelEl);

  // Initial render
  renderLinks();
}
