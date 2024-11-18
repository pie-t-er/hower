let highlightedTaskId = null;
function loadTasksView() {
    fetch('/api/tasks')
        .then(response => response.json())
        .then(tasks => {
            console.log('tasks imported')
            const taskList = document.getElementById('taskList');
            taskList.innerHTML = '';  // Clear the list before re-populating it
            tasks.forEach(task => {
                const li = document.createElement('li');
                li.setAttribute('data-task-id', task.id);
                li.classList.add('task-item');  // Add class to the list item

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

                // Task Color Button
                const colorButton = document.createElement('button');
                colorButton.classList.add('task-color');
                colorButton.style.backgroundColor = task.color || '#ccc'; // Set the background color
                colorButton.setAttribute('data-task-id', task.id); // Add the task ID as a data attribute
                colorButton.onclick = (e) => {
                    e.stopPropagation(); // Prevent triggering the click event on the li element
                    openEditFormView(task, colorButton, li);
                };

                li.appendChild(colorButton);

                // Add event listener for highlighting the task container (li)
                li.onclick = () => handleTaskClick(li);

                taskList.appendChild(li);
            });
        })
        .catch(error => console.error('Error loading tasks:', error));
}

function handleTaskClick(taskElement) {
    // First, remove the "highlighted" class from all task elements
    const allTasks = document.querySelectorAll('.task-item');
    allTasks.forEach(task => {
        task.classList.remove('highlighted');  // Remove the "highlighted" class from each task
    });

    // Then, add the "highlighted" class to the clicked task
    highlightedTaskId = taskElement.getAttribute('data-task-id');
    taskElement.classList.add('highlighted');

     fetch('/api/tasks')
        .then(response => response.json())
        .then(tasks => {
            console.log("Fetched tasks:", tasks); // Log the tasks
            drawDots(tasks);  // Redraw the dots based on updated tasks
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });

}

function openEditFormView(task, colorButton, li) {
    const editFormContainer = document.getElementById('editTaskFormContainer');
    const newFormContainer = document.getElementById('taskFormContainer');
    const matrix = document.getElementById('matrix');

    // Hide the new task form and the matrix
    newFormContainer.style.display = 'none';
    matrix.style.display = 'none';

    // Prefill the edit form with task data
    document.getElementById('editTaskId').value = task.id; // Store task ID in hidden input
    document.getElementById('editTaskInput').value = task.content;
    document.getElementById('editTaskLocation').value = task.location || '';
    document.getElementById('editTaskDueDate').value = task.due_date || '';
    document.getElementById('editTaskDueTime').value = task.due_time || '';
    document.getElementById('editTaskPriority').value = task.priority || '';
    document.getElementById('editTaskColor').value = task.color || '#4CAF50';
    editFormContainer.style.display = 'block';
    // Add 'active' class to the clicked task button

    highlightedTaskId = li.getAttribute('data-task-id');
     const allTasks = document.querySelectorAll('.task-item');
    allTasks.forEach(task => {
        task.classList.remove('highlighted');  // Remove the "highlighted" class from each task
    });
    li.classList.add('highlighted'); // Add the highlighted class to the task (li)


    // Show the edit form
}

function closeEditFormView() {
    const editFormContainer = document.getElementById('editTaskFormContainer');
    const colorButtons = document.querySelectorAll('.task-color.active'); // Find all active buttons

    // Remove the 'active' class from all buttons
    colorButtons.forEach(button => button.classList.remove('active'));

    // Hide the edit form
    editFormContainer.style.display = 'none';

    // Optionally, show the matrix or task form again
    const matrix = document.getElementById('matrix');
    matrix.style.display = 'block';

     fetch('/api/tasks')
        .then(response => response.json())
        .then(tasks => {
            console.log("Fetched tasks:", tasks); // Log the tasks
            drawDots(tasks);  // Redraw the dots based on updated tasks
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}

function editTaskView() {
    const taskId = document.getElementById('editTaskId').value; // Get task ID from hidden input
    const task = {
        task: document.getElementById('editTaskInput').value.trim(),
        location: document.getElementById('editTaskLocation').value.trim(),
        due_date: document.getElementById('editTaskDueDate').value,
        due_time: document.getElementById('editTaskDueTime').value,
        priority: document.getElementById('editTaskPriority').value,
        color: document.getElementById('editTaskColor').value
    };

    fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(task)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw err; });
        }
        return response.json();
    })
    .then(data => {
        console.log(data.message);
        loadTasksView(); // Reload tasks
        document.getElementById('editTaskFormContainer').style.display = 'none'; // Hide edit form
    })
    .catch(error => {
        console.error('Error editing task:', error);
        alert(error.error || 'An error occurred while editing the task.');
    });
}

function addTaskView() {
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
          loadTasksView();
      })
      .catch(error => {
          console.error('Error adding task:', error.error || error);
          alert(error.error || 'An error occurred while adding the task.');
      });
  } else {
      alert('Task description cannot be empty.');
  }
}

function toggleTaskForm() {
    const formContainer = document.getElementById('taskFormContainer');
    const editFormContainer = document.getElementById('editTaskFormContainer'); // Add this line
    const matrix = document.getElementById('matrix');

    // Check if the edit form is visible
    if (editFormContainer.style.display === 'block') {
        editFormContainer.style.display = 'none'; // Hide the edit form
    }

    // Toggle the new task form
    if (formContainer.style.display === 'none') {
        formContainer.style.display = 'block';
        matrix.style.display = 'none'; // Hide image when form is shown
    } else {
        formContainer.style.display = 'none';
        matrix.style.display = 'block'; // Show image when form is hidden
        fetch('/api/tasks')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(tasks => {
                console.log("Fetched tasks:", tasks); // Log the tasks
                drawDots(tasks);
                console.log("drawDots called");
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
            });
    }
}

function drawDots(tasks) {
    const canvas = document.getElementById('taskCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

    const today = new Date(); // Correctly get the current date
    const maxDays = 30; // Define the max days threshold

    tasks.forEach(task => {
        if (!task.due_date || !task.due_time) {
            console.error('Invalid task:', task);
            return; // Skip this task if date/time is missing
        }

        // Calculate Y position based on priority
        const yPos = ((task.priority || 1)) * ((canvas.height - 26) / 10);
        console.log("Task Y position:", yPos);

        // Combine date and time into a single Date object
        const dueDate = new Date(task.due_date + 'T' + task.due_time);
        const diffTime = dueDate - today; // Difference in milliseconds
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert to days

        console.log("Task due date:", dueDate, "Diff days:", diffDays);

        let xPos;
        if (diffDays > maxDays) {
            xPos = canvas.width; // Place at far right
        } else {
            xPos = (diffDays / maxDays) * (canvas.width - 34); // Scale based on maxDays
        }

        // Draw dot
        ctx.fillStyle = task.color || '#000'; // Use task color or default
        ctx.beginPath();
        ctx.arc(xPos, yPos, 5, 0, Math.PI * 2); // Draw a circle
        ctx.fill();


        if (highlightedTaskId === task.id.toString()) {
            ctx.lineWidth = 2; // Set the outline width
            ctx.strokeStyle = '#8B0000'; // Dark red color for outline
            ctx.stroke(); // Apply the outline
        }
    });
}

// Load tasks when the page loads
document.addEventListener('DOMContentLoaded', loadTasksView);
