    function loadTasks() {
  fetch('/api/tasks')
      .then(response => response.json())
      .then(tasks => {
          const taskList = document.getElementById('taskList');
          taskList.innerHTML = '';
          tasks.forEach(task => {
              const li = document.createElement('li');

              // Task Details Container
              const detailsDiv = document.createElement('div');
              detailsDiv.classList.add('task-details');

              // Task Content
              const contentP = document.createElement('p');
              contentP.textContent = `Task: ${task.content}`;
              detailsDiv.appendChild(contentP);

              if (task.priority) {
                const prior = document.createElement('p');
                prior.textContent = `Priority: ${task.priority}`;
                detailsDiv.appendChild(prior);
              }

              // Location (if exists)
              if (task.location) {
                  const locationP = document.createElement('p');
                  locationP.textContent = `Location: ${task.location}`;
                  detailsDiv.appendChild(locationP);
              }

              // Due Date and Time (if exists)
              if (task.due_date || task.due_time) {
                const dueP = document.createElement('p');
                let dueText = 'Due: ';
                if (task.due_date) {
                    dueText += `${task.due_date}`;
                }
                if (task.due_time) {
                    dueText += ` at ${task.due_time}`;
                }
                dueP.textContent = dueText;
                detailsDiv.appendChild(dueP);
              }

              li.appendChild(detailsDiv);

              // Task Color (if exists)
              if (task.color) {
                  const colorSpan = document.createElement('span');
                  colorSpan.classList.add('task-color');
                  colorSpan.textContent = '■'; // Colored square
                  colorSpan.style.color = task.color;
                  li.appendChild(colorSpan);
              }

              taskList.appendChild(li);
          });
      })
      .catch(error => console.error('Error loading tasks:', error));
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
              // If you're handling user authentication, include user_id here
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
          loadTasks();
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
  
    const colorInput = document.getElementById('eventColor');
    const color = colorInput.value; // Format: '#FFFFFF'
  
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
                eDate: endTime || null,
                eTime: endDate || null,
                color: color || null
                // If you're handling user authentication, include user_id here
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
            eventInput.value = '';
            dateInput.value = '';
            timeInput.value = '';
            endDateInput.value = '';
            endTimeInput.value = '';
            colorInput.value = '#4CAF50'; // Reset to default color
            // loadEvents();
        })
        .catch(error => {
            console.error('Error adding task:', error.error || error);
            alert(error.error || 'An error occurred while adding the task.');
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
  document.addEventListener('DOMContentLoaded', loadTasks);