function loadItems() {
    fetch('api/returnAll')
    .then(response => response.json())
    .then(combined_list => {
        const list = document.getElementById('list');
        list.innerHTML = '';

        combined_list.forEach(item => {
            const li = document.createElement('li');
            li.classList.add(item.type === 'task' ? 'task-item' : 'event-item');
            li.id = `item-${item.id}`; // Assign ID for easy deletion

            const detailsDiv = document.createElement('div');
            detailsDiv.classList.add('item-details');

            // Add checkbox for tasks
            if (item.type === 'task') {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.classList.add('task-checkbox');
                checkbox.checked = item.completed || false;
                checkbox.addEventListener('change', () => toggleTaskCompletion(item.id, checkbox.checked));
                li.appendChild(checkbox);

                const contentP = document.createElement('p');
                contentP.textContent = `Task: ${item.content}`;
                detailsDiv.appendChild(contentP);

                if (item.priority) {
                    const prior = document.createElement('p');
                    prior.textContent = `Priority: ${item.priority}`;
                    detailsDiv.appendChild(prior);
                }

                if (item.location) {
                    const locationP = document.createElement('p');
                    locationP.textContent = `Location: ${item.location}`;
                    detailsDiv.appendChild(locationP);
                }

                if (item.due_date || item.due_time) {
                    const dueP = document.createElement('p');
                    dueP.textContent = `Due: ${item.due_date || ''} ${item.due_time ? 'at ' + item.due_time : ''}`;
                    detailsDiv.appendChild(dueP);
                }

            } else if (item.type === 'event') {
                const contentP = document.createElement('p');
                contentP.textContent = `Event: ${item.title}`;
                detailsDiv.appendChild(contentP);

                if (item.location) {
                    const locationP = document.createElement('p');
                    locationP.textContent = `Location: ${item.location}`;
                    detailsDiv.appendChild(locationP);
                }

                if (item.event_date || item.event_time) {
                    const dateP = document.createElement('p');
                    dateP.textContent = `${item.event_date || ''} ${item.event_time ? '@ ' + item.event_time : ''}`;
                    detailsDiv.appendChild(dateP);
                }

                li.style.backgroundColor = item.color || '#4CAF50';
                li.style.color = '#FFFFFF';
            }

            li.appendChild(detailsDiv);

            // Edit and Delete Buttons
            const actionsDiv = document.createElement('div');
            actionsDiv.classList.add('item-actions');

            const editButton = document.createElement('button');
            editButton.classList.add('edit-button');
            editButton.textContent = 'Edit';
            editButton.addEventListener('click', () => editItem(item.id));
            actionsDiv.appendChild(editButton);

            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-button');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => deleteItem(item.id, item.type)); // Pass item type for deletion
            actionsDiv.appendChild(deleteButton);

            li.appendChild(actionsDiv);
            list.appendChild(li);
        });
    })
    .catch(error => console.error('Error loading tasks and events:', error));
}

// Placeholder functions for task completion, edit, and delete
function toggleTaskCompletion(id, isCompleted) {
    console.log(`Task ${id} completion status: ${isCompleted}`);
    // Implement the update API call here
    if (isCompleted) {
        deleteItem(id, 'task-item');
    }
}

function editItem(id) {
    console.log(`Edit item with id: ${id}`);
    // Implement the edit functionality here
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
            toggleDropdown();
            loadItems();
        })
        .catch(error => {
            console.error('Error adding task:', error.error || error);
            alert(error.error || 'An error occurred while adding the task.');
        });
    }
    else {
        alert('Task description cannot be empty.');
    }
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
            toggleDropdown();
            loadItems();
        })
        .catch(error => {
            console.error('Error adding event:', error.error || error);
            alert(error.error || 'An error occurred while adding the event.');
        });
    }
  }

function toggleDropdown() {
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    // if one of the forms are currently open, clicking the X closes all forms and clears the form
    if (document.getElementById("taskForm").style.display === 'block') {
        document.querySelector('.add-button').classList.remove("rotate");
        hideForms()
        document.getElementById("taskForm").reset()
    }
    else if (document.getElementById("eventForm").style.display === 'block') {
        document.querySelector('.add-button').classList.remove("rotate");
        hideForms()
        document.getElementById("eventForm").reset()
    }
    // if the dropdown menu is open, clicking the X cancels this operation
    else if (dropdownMenu.style.display === 'flex') {
        document.querySelector('.add-button').classList.remove("rotate");
        dropdownMenu.style.display = 'none'
    }
    // if none of the forms are open, then the dropdown opens and the button becomes a cancel button.
    else {
        document.querySelector('.add-button').classList.add("rotate");
        dropdownMenu.style.display = 'flex'
    }
}
  
function showForm(type) {
    const taskForm = document.getElementById("taskForm");
    const eventForm = document.getElementById("eventForm");

    if (type === "task") {
        taskForm.style.display = "block";
    } else if (type === "event") {
        eventForm.style.display = "block";
    }
    document.getElementById("dropdownMenu").style.display = "none";
}
  
function hideForms() {
    // Hide both forms and reset dropdown display
    document.getElementById("taskForm").style.display = "none";
    document.getElementById("eventForm").style.display = "none";
    document.getElementById("dropdownMenu").style.display = "none";
}
  
function updatePriorityValue(value) {
    document.getElementById("priorityValue").textContent = value;
}
  
// Load tasks when the page loads
document.addEventListener('DOMContentLoaded', loadItems);