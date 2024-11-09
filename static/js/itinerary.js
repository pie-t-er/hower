import { toggleDropdown, showForm } from './ui-handlers.js';
import { loadItems, addTask, addEvent } from './api-client.js';

window.toggleDropdown = toggleDropdown;
window.showForm = showForm;
window.updatePriorityValue = updatePriorityValue;
window.addTask = addTask;
window.addEvent = addEvent;

function updatePriorityValue(value) {
  document.getElementById("priorityValue").textContent = value;
}

// Load tasks when the page loads
document.addEventListener('DOMContentLoaded', loadItems);