/**
 * main.js — Entry point.
 * Bootstraps all four widgets on DOMContentLoaded.
 */

import { init as initGreeting } from './greeting.js';
import { init as initTimer }    from './timer.js';
import { init as initTodo }     from './todo.js';
import { init as initLinks }    from './links.js';

document.addEventListener('DOMContentLoaded', () => {
  initGreeting(document.getElementById('greeting-widget'));
  initTimer(document.getElementById('timer-widget'));
  initTodo(document.getElementById('todo-widget'));
  initLinks(document.getElementById('links-widget'));
});
