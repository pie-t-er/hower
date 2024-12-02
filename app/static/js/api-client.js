import{ itineraryElement, toggleDropdown } from './ui-handlers.js';

function loadItems() {
  fetch('api/returnAll')
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
          'Content-Type': 'application/json'
      }
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

function addTask() {
  const taskInput = document.getElementById('taskInput');
  const task = taskInput.value.trim();

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

  console.log('Collected data');

  if (task) {
      console.log(task);
      fetch('/api/tasks', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
              task: task,
              location: location || null,
              due_date: due_date || null,
              due_time: due_time || null,
              priority: priority || 5,
              color: color || null
          }),
      })
      .then(response => {
          console.log(response);
           if (!response.ok) {
              console.log('uh oh');
              console.log('I get an "Internal Server Error" here sometimes, usually has something to do with a wrong or null user_id being assigned to a task')
              return response.json().then(err => { throw err; });
          }
          return response.json();
      })
      .then(data => {
          console.log(data.message);
          // Clear all input fields after successful addition
          taskInput.value = '';
          locationInput.value = '';
          dueDateInput.value = '';
          dueTimeInput.value = '';
          priorityInput.value = '';
          colorInput.value = '#4CAF50'; // Reset to default color
      })
      .catch(error => {
          console.error('Error adding task:', error.error || error);
          alert(error.error || 'An error occurred while adding the task.');
      });
  }
  else {
      alert('Task description cannot be empty.');
  }
  toggleDropdown();
  loadItems();
}

function addEvent() {
  const eventInput = document.getElementById('eventInput');
  const event = eventInput.value.trim();

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

  console.log('Collected data');

  if (event) {
      console.log(event);
      fetch('/api/events', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
              event: event,
              location: location || null,
              date: date || null,
              time: time || null,
              eDate: endDate || null,
              eTime: endTime || null,
          }),
      })
      .then(response => {
          console.log(response);
          if (!response.ok) {
              console.log('uh oh');
              console.log('I get an "Internal Server Error" here sometimes, usually has something to do with a wrong or null user_id being assigned to an event')
              return response.json().then(err => { throw err; });
          }
          return response.json();
      })
      .then(data => {
          console.log(data.message);
          // Clear all input fields after successful addition
          eventInput.value = '';
          locationInput.value = '';
          dateInput.value = '';
          timeInput.value = '';
          endDateInput.value = '';
          endTimeInput.value = '';
      })
      .catch(error => {
          console.error('Error adding event:', error.error || error);
          alert(error.error || 'An error occurred while adding the event.');
      });
  }
  toggleDropdown();
  loadItems();
}

function editTask(taskID) {
    const taskInput = document.getElementById('taskInput');
    const task = taskInput.value.trim();

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

    console.log('Collected data');

    fetch(`/api/tasks/${taskID}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            task: task,
            location: location || null,
            due_date: due_date || null,
            due_time: due_time || null,
            priority: priority || 5,
            color: color || null
        }),
    })
    .then(response => {
        console.log(response);
            if (!response.ok) {
            console.log('uh oh');
            console.log(`I get an "Internal Server Error" here sometimes, usually has something to do with a wrong or null user_id being assigned to a task`)
            return response.json().then(err => { throw err; });
        }
        return response.json();
    })
    .then(data => {
        console.log(data.message);
        // Clear all input fields after successful edit
        taskInput.value = '';
        locationInput.value = '';
        dueDateInput.value = '';
        dueTimeInput.value = '';
        priorityInput.value = '';
        colorInput.value = '#4CAF50'; // Reset to default color
    })
    .catch(error => {
        console.error('Error editing task:', error.error || error);
        alert(error.error || 'An error occurred while editing the task.');
    });
}

function editEvent(eventID) {
    const eventInput = document.getElementById('eventInput');
    const event = eventInput.value.trim();
  
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
  
    console.log('Collected data');
  
    if (event) {
        console.log(event);
        fetch(`/api/events/${eventID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                event: event,
                location: location || null,
                date: date || null,
                time: time || null,
                eDate: endDate || null,
                eTime: endTime || null,
            }),
        })
        .then(response => {
            console.log(response);
            if (!response.ok) {
                console.log('uh oh');
                console.log('I get an "Internal Server Error" here sometimes, usually has something to do with a wrong or null user_id being assigned to an event')
                return response.json().then(err => { throw err; });
            }
            return response.json();
        })
        .then(data => {
            console.log(data.message);
            // Clear all input fields after successful addition
            eventInput.value = '';
            locationInput.value = '';
            dateInput.value = '';
            timeInput.value = '';
            endDateInput.value = '';
            endTimeInput.value = '';
        })
        .catch(error => {
            console.error('Error editing event:', error.error || error);
            alert(error.error || 'An error occurred while editing the event.');
        });
    }
  }

export{ loadItems, deleteItem, addTask, addEvent, editTask, editEvent };