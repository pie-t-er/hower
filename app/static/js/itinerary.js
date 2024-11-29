// import the necessary functions for ui handling and api routing
import { toggleDropdown, showForm } from './ui-handlers.js';
import { loadItems, addTask, addEvent, editTask, editEvent } from './api-client.js';

// these variables/functions are used in the index.html template, this allows them to be called
window.toggleDropdown = toggleDropdown;
window.showForm = showForm;
window.addTask = addTask;
window.addEvent = addEvent;
window.editTask = editTask;
window.editEvent = editEvent;

// the only place this function is used
function updatePriorityValue(value) {
  document.getElementById("priorityValue").textContent = value;
}

// Load tasks when the page loads
document.addEventListener('DOMContentLoaded', loadItems);

export { toggleDropdown }