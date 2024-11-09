import { toggleDropdown, showForm } from './ui-handlers.js';
import { loadItems, addTask, addEvent } from './api-client.js';
import { updatePriorityValue } from './utils.js';

window.toggleDropdown = toggleDropdown;
window.showForm = showForm;
window.updatePriorityValue = updatePriorityValue;
window.addTask = addTask;
window.addEvent = addEvent;

// Load tasks when the page loads
document.addEventListener('DOMContentLoaded', loadItems);