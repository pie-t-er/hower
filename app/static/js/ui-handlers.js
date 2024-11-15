import{ deleteItem, editItem } from './api-client.js'

function itineraryElement(combined_list) {
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

// Placeholder function for task completion, this function is unused
function toggleTaskCompletion(id, isCompleted) {
    console.log(`Task ${id} completion status: ${isCompleted}`);
    // Implement the update API call here
    if (isCompleted) {
        deleteItem(id, 'task');
    }
  }

export { itineraryElement, toggleDropdown, showForm };