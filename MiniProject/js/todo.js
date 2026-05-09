/**
 * todo.js — To-Do List module.
 * Manages a list of tasks with add, edit, complete, and delete operations.
 * All state is persisted to localStorage via storage.js.
 */

import { load, save } from './storage.js';

const STORAGE_KEY = 'tasks';

/** @type {Array<{id: string, description: string, completed: boolean}>} */
let tasks = [];

/** @type {HTMLElement|null} */
let containerEl = null;

/** @type {HTMLUListElement|null} */
let taskListEl = null;

/** @type {HTMLInputElement|null} */
let addInputEl = null;

/** @type {HTMLElement|null} */
let addValidationEl = null;

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

// ─── Rendering ──────────────────────────────────────────────────────────────

/**
 * Clear and re-render the task list from the in-memory `tasks` array.
 * Each item includes a completion toggle, an edit button, and a delete button.
 * Completed tasks receive the `task-completed` CSS class for strikethrough styling.
 */
function renderTasks() {
  if (!taskListEl) return;

  taskListEl.innerHTML = '';

  if (tasks.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'todo-empty';
    empty.textContent = 'No tasks yet. Add one above!';
    taskListEl.appendChild(empty);
    return;
  }

  tasks.forEach((task) => {
    const li = document.createElement('li');
    li.className = `todo-item${task.completed ? ' task-completed' : ''}`;
    li.dataset.id = task.id;

    // ── Completion toggle ──────────────────────────────────────────────────
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'btn todo-toggle';
    toggle.setAttribute('aria-label', task.completed ? 'Mark incomplete' : 'Mark complete');
    toggle.setAttribute('aria-pressed', String(task.completed));
    toggle.textContent = task.completed ? '✓' : '○';
    toggle.addEventListener('click', () => handleToggle(task.id));

    // ── Task description ───────────────────────────────────────────────────
    const descSpan = document.createElement('span');
    descSpan.className = 'todo-desc';
    descSpan.textContent = task.description;

    // ── Edit button ────────────────────────────────────────────────────────
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn btn-secondary todo-edit';
    editBtn.setAttribute('aria-label', `Edit task: ${task.description}`);
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => enterEditMode(task.id, li));

    // ── Delete button ──────────────────────────────────────────────────────
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn-danger todo-delete';
    deleteBtn.setAttribute('aria-label', `Delete task: ${task.description}`);
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => handleDelete(task.id));

    li.appendChild(toggle);
    li.appendChild(descSpan);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);

    taskListEl.appendChild(li);
  });
}

// ─── Edit mode ───────────────────────────────────────────────────────────────

/**
 * Replace the task text with an inline input pre-filled with the current
 * description, plus Confirm and Cancel buttons.
 *
 * @param {string} id
 * @param {HTMLLIElement} li
 */
function enterEditMode(id, li) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  // Clear the list item and rebuild it in edit mode.
  li.innerHTML = '';

  // ── Inline edit input ──────────────────────────────────────────────────
  const editInput = document.createElement('input');
  editInput.type = 'text';
  editInput.className = 'todo-edit-input';
  editInput.value = task.description;
  editInput.setAttribute('aria-label', 'Edit task description');

  // ── Inline validation message ──────────────────────────────────────────
  const validationMsg = document.createElement('span');
  validationMsg.className = 'validation-msg todo-edit-validation';
  validationMsg.setAttribute('aria-live', 'polite');

  // Clear validation message when the user starts typing.
  editInput.addEventListener('input', () => {
    validationMsg.textContent = '';
  });

  // ── Confirm button ─────────────────────────────────────────────────────
  const confirmBtn = document.createElement('button');
  confirmBtn.type = 'button';
  confirmBtn.className = 'btn btn-primary todo-confirm';
  confirmBtn.textContent = 'Save';
  confirmBtn.setAttribute('aria-label', 'Save edit');
  confirmBtn.addEventListener('click', () => handleEditConfirm(id, editInput, validationMsg));

  // Allow pressing Enter to confirm.
  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleEditConfirm(id, editInput, validationMsg);
    if (e.key === 'Escape') renderTasks(); // cancel on Escape
  });

  // ── Cancel button ──────────────────────────────────────────────────────
  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn btn-secondary todo-cancel';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.setAttribute('aria-label', 'Cancel edit');
  cancelBtn.addEventListener('click', () => renderTasks());

  li.appendChild(editInput);
  li.appendChild(validationMsg);
  li.appendChild(confirmBtn);
  li.appendChild(cancelBtn);

  editInput.focus();
  editInput.select();
}

// ─── Action handlers ─────────────────────────────────────────────────────────

/**
 * Handle add-task form submission.
 *
 * @param {Event} e
 */
function handleAdd(e) {
  e.preventDefault();
  const description = addInputEl.value.trim();

  if (!description) {
    addValidationEl.textContent = 'Task description cannot be empty.';
    return;
  }

  const newTask = {
    id: generateId(),
    description,
    completed: false,
  };

  tasks.push(newTask);
  save(STORAGE_KEY, tasks);
  renderTasks();
  addInputEl.value = '';
  addValidationEl.textContent = '';
  addInputEl.focus();
}

/**
 * Confirm an inline edit for the task with the given id.
 *
 * @param {string} id
 * @param {HTMLInputElement} editInput
 * @param {HTMLElement} validationMsg
 */
function handleEditConfirm(id, editInput, validationMsg) {
  const description = editInput.value.trim();

  if (!description) {
    validationMsg.textContent = 'Task description cannot be empty.';
    return;
  }

  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return;

  tasks[idx] = { ...tasks[idx], description };
  save(STORAGE_KEY, tasks);
  renderTasks();
}

/**
 * Toggle the completion state of the task with the given id.
 *
 * @param {string} id
 */
function handleToggle(id) {
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return;

  tasks[idx] = { ...tasks[idx], completed: !tasks[idx].completed };
  save(STORAGE_KEY, tasks);
  renderTasks();
}

/**
 * Delete the task with the given id.
 *
 * @param {string} id
 */
function handleDelete(id) {
  tasks = tasks.filter((t) => t.id !== id);
  save(STORAGE_KEY, tasks);
  renderTasks();
}

// ─── Init ────────────────────────────────────────────────────────────────────

/**
 * Initialise the To-Do List widget inside the given container element.
 * Loads persisted tasks from storage, renders the add-task form and task list.
 *
 * @param {HTMLElement} el
 */
export function init(el) {
  containerEl = el;

  // Load persisted tasks (Task 5.1 — Requirements 7.2, 7.3)
  tasks = load(STORAGE_KEY, []);

  // ── Build widget structure ───────────────────────────────────────────────
  containerEl.innerHTML = '';

  const heading = document.createElement('h2');
  heading.textContent = 'To-Do List';
  containerEl.appendChild(heading);

  // ── Add-task form (Task 5.3 — Requirements 5.1, 5.2, 5.3) ───────────────
  const form = document.createElement('form');
  form.className = 'todo-form';
  form.setAttribute('aria-label', 'Add new task');
  form.noValidate = true;

  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'todo-input-wrapper';

  addInputEl = document.createElement('input');
  addInputEl.type = 'text';
  addInputEl.className = 'todo-input';
  addInputEl.placeholder = 'Add a new task…';
  addInputEl.setAttribute('aria-label', 'New task description');
  addInputEl.setAttribute('autocomplete', 'off');

  // Clear validation message when the user starts typing.
  addInputEl.addEventListener('input', () => {
    if (addValidationEl) addValidationEl.textContent = '';
  });

  const addBtn = document.createElement('button');
  addBtn.type = 'submit';
  addBtn.className = 'btn btn-primary todo-add-btn';
  addBtn.textContent = 'Add';

  addValidationEl = document.createElement('span');
  addValidationEl.className = 'validation-msg todo-add-validation';
  addValidationEl.setAttribute('aria-live', 'polite');

  inputWrapper.appendChild(addInputEl);
  inputWrapper.appendChild(addBtn);
  form.appendChild(inputWrapper);
  form.appendChild(addValidationEl);

  form.addEventListener('submit', handleAdd);
  containerEl.appendChild(form);

  // ── Task list (Task 5.2 — Requirements 6.1, 6.2, 6.3) ───────────────────
  taskListEl = document.createElement('ul');
  taskListEl.className = 'todo-list';
  taskListEl.setAttribute('aria-label', 'Task list');
  containerEl.appendChild(taskListEl);

  // Initial render
  renderTasks();
}
