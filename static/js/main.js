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
              priority: priority || null,
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

// Load tasks when the page loads
document.addEventListener('DOMContentLoaded', loadTasks);