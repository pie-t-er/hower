import { itineraryElement, toggleDropdown } from './ui-handlers.js';
const { ipcRenderer } = require('electron');

function loadItems() {
  fetch('api/returnAll', {
    credentials: 'include', // Include credentials to ensure cookies are sent
  })
    .then(response => response.json())
    .then(combined_list => {
      itineraryElement(combined_list);
    })
    .catch(error => console.error('Error loading tasks and events:', error));
}

function deleteItem(itemId, itemType) {
  // Determine the appropriate API endpoint based on item type
  const endpoint = itemType === 'task' ? `/api/tasks/${itemId}` : `/api/events/${itemId}`;

  fetch(endpoint, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  })
    .then(response => {
      if (response.ok) {
        // Remove the item from the UI after successful deletion
        const itemElement = document.getElementById(`item-${itemId}`);
        if (itemElement) {
          itemElement.remove();
        }
        console.log(`${itemType} deleted successfully.`);
      } else {
        // Handle errors, if any
        response.json().then(data => {
          console.error(data.error || `Failed to delete ${itemType}.`);
        });
      }
    })
    .catch(error => console.error(`An error occurred: ${error}`));
}

// This function hasn't been implemented...
function editItem(itemId, item) {
  // Implement your edit logic here
}

function addTask() {
  const taskInput = document.getElementById('taskInput');
  const taskContent = taskInput.value.trim();

  const locationInput = document.getElementById('taskLocation');
  const location = locationInput.value.trim();

  const dueDateInput = document.getElementById('taskDueDate');
  const due_date = dueDateInput.value; // Format: 'YYYY-MM-DD'

  const dueTimeInput = document.getElementById('taskDueTime');
  const due_time = dueTimeInput.value; // Format: 'HH:MM'

  const priorityInput = document.getElementById('taskPriority');
  const priority = priorityInput.value;

  const colorInput = document.getElementById('taskColor');
  const color = colorInput.value; // Format: '#FFFFFF'

  const notificationInput = document.getElementById('taskNotification');
  const notification_offset = notificationInput.value ? parseInt(notificationInput.value) : null;

  console.log('Collected data');

  if (taskContent) {
    console.log(taskContent);
    fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include credentials to ensure cookies are sent
      body: JSON.stringify({
        task: taskContent,
        location: location || null,
        due_date: due_date || null,
        due_time: due_time || null,
        priority: priority || 5,
        color: color || null,
        notification_offset: notification_offset,
      }),
    })
      .then(response => {
        console.log(response);
        if (!response.ok) {
          console.log('uh oh');
          console.log(
            'I get an "Internal Server Error" here sometimes, usually has something to do with a wrong or null user_id being assigned to a task'
          );
          return response.json().then(err => {
            throw err;
          });
        }
        return response.json();
      })
      .then(data => {
        console.log(data.message);

        // Send IPC message to main process with new task details
        const newTask = data.task; // Assuming the backend returns the new task in data.task
        newTask.type = 'task'; // Ensure the type is set to 'task'
        ipcRenderer.send('new-task-added', newTask);

        // Clear all input fields after successful addition
        taskInput.value = '';
        locationInput.value = '';
        dueDateInput.value = '';
        dueTimeInput.value = '';
        priorityInput.value = '';
        notificationInput.value = '';
        colorInput.value = '#4CAF50'; // Reset to default color
        toggleDropdown();
        loadItems();
      })
      .catch(error => {
        console.error('Error adding task:', error.error || error);
        alert(error.error || 'An error occurred while adding the task.');
      });
  } else {
    alert('Task description cannot be empty.');
  }
}

function addEvent() {
  const eventInput = document.getElementById('eventInput');
  const eventTitle = eventInput.value.trim();

  const locationInput = document.getElementById('eventLocation');
  const location = locationInput.value.trim();

  const dateInput = document.getElementById('eventDate');
  const date = dateInput.value; // Format: 'YYYY-MM-DD'

  const timeInput = document.getElementById('eventTime');
  const time = timeInput.value; // Format: 'HH:MM'

  const endDateInput = document.getElementById('endDate');
  const endDate = endDateInput.value; // Format: 'YYYY-MM-DD'

  const endTimeInput = document.getElementById('endTime');
  const endTime = endTimeInput.value; // Format: 'HH:MM'

  const notificationInput = document.getElementById('eventNotification');
  const notification_offset = notificationInput.value ? parseInt(notificationInput.value) : null;

  console.log('Collected data');

  if (eventTitle) {
    console.log(eventTitle);
    fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include credentials to ensure cookies are sent
      body: JSON.stringify({
        event: eventTitle,
        location: location || null,
        date: date || null,
        time: time || null,
        eDate: endDate || null,
        eTime: endTime || null,
        notification_offset: notification_offset,
      }),
    })
      .then(response => {
        console.log(response);
        if (!response.ok) {
          console.log('uh oh');
          console.log(
            'I get an "Internal Server Error" here sometimes, usually has something to do with a wrong or null user_id being assigned to an event'
          );
          return response.json().then(err => {
            throw err;
          });
        }
        return response.json();
      })
      .then(data => {
        console.log(data.message);

        // Send IPC message to main process with new event details
        const newEvent = data.event; // Assuming the backend returns the new event in data.event
        newEvent.type = 'event'; // Ensure the type is set to 'event'
        ipcRenderer.send('new-event-added', newEvent);

        // Clear all input fields after successful addition
        eventInput.value = '';
        locationInput.value = '';
        dateInput.value = '';
        timeInput.value = '';
        endDateInput.value = '';
        endTimeInput.value = '';
        toggleDropdown();
        loadItems();
      })
      .catch(error => {
        console.error('Error adding event:', error.error || error);
        alert(error.error || 'An error occurred while adding the event.');
      });
  } else {
    alert('Event title cannot be empty.');
  }
}

export { loadItems, deleteItem, addTask, addEvent, editItem };
