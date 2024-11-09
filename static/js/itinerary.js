import { toggleDropdown } from './ui-handlers';
import { loadItems } from './api-client.js';
import { updatePriorityValue } from './utils.js';

// Load tasks when the page loads
document.addEventListener('DOMContentLoaded', loadItems);