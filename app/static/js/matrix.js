let highlightedTaskId = null;
let week = 0;
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

            // Draw dots on the canvas using the fetched tasks
            drawDots(tasks);
        })
        .catch(error => console.error('Error loading tasks:', error));
}
function filterTasks() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const taskItems = document.querySelectorAll('#taskList li');

    taskItems.forEach(taskItem => {
        const taskContent = taskItem.querySelector('.task-details p').textContent.toLowerCase();
        if (taskContent.includes(searchInput)) {
            taskItem.style.display = '';
        } else {
            taskItem.style.display = 'none';
        }
    });
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
    
    const matrix = document.getElementById('matrix');
    console.log('FUUUUUUUUUUUUUUUCK');
    const matrixDisplay = getComputedStyle(matrix).display;
    if (matrixDisplay != 'none') {
    document.getElementById('prioritySliderContainer').style.display = 'flex';
    fetch(`/api/tasks/${highlightedTaskId}`)
        .then(response => response.json())
        .then(task => {
            document.getElementById('prioritySlider').value = task.priority || 5;
            
        })
        .catch(error => console.error('Error fetching task:', error));
    }
        fetch('/api/tasks')
        .then(response => response.json())
        .then(tasks => {
            drawDots(tasks);
        })
}

function clearSelection() {
    highlightedTaskId = null;
    document.getElementById('prioritySliderContainer').style.display = 'none';
}

function openEditFormView(task, colorButton, li) {
    const editFormContainer = document.getElementById('editTaskFormContainer');
    const newFormContainer = document.getElementById('taskFormContainer');
    const matrix = document.getElementById('matrix');

    // Hide the new task form and the matrix
    newFormContainer.style.display = 'none';
    matrix.style.display = 'none';

    document.getElementById('prioritySliderContainer').style.display = 'none';
    const matrix = document.getElementById('matrix');
    
    // Hide the new task form and the matrix
    
    matrix.style.display = 'none';
    const calendar = document.getElementById('calendarContainer');
    calendar.style.display = 'none';
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
    const formContainer = document.getElementById('calendarContainer');
    const editFormContainer = document.getElementById('editTaskFormContainer'); // Add this line
    const matrix = document.getElementById('matrix');
    const slider = document.getElementById('prioritySliderContainer');

    // Check if the edit form is visible
    if (editFormContainer.style.display === 'block') {
        editFormContainer.style.display = 'none'; // Hide the edit form
    }

    // Toggle the new task form
    if (formContainer.style.display === 'none') {
        formContainer.style.display = 'block';
        matrix.style.display = 'none'; // Hide image when form is shown
        slider.style.display = 'none'; // Hide slider when
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
        const yPos = ((task.priority || 1)) * ((canvas.height - 5) / 10);
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
            xPos = (diffDays / maxDays) * (canvas.width + 15); // Scale based on maxDays
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
document.addEventListener("DOMContentLoaded", () => {
    // Load tasks and draw dots when the page loads
    loadTasksView();

    // Set up slider height adjustment
    const matrixImage = document.getElementById("matrix");
    const prioritySlider = document.getElementById("prioritySliderContainer");

    function adjustSliderHeight() {
        if (matrixImage) {
            const matrixHeight = matrixImage.clientHeight;
            prioritySlider.style.height = `${matrixHeight}px`;
            document.getElementById("prioritySlider").style.height = `${matrixHeight}px`;
        }
    }

    // Initial adjustment and on window resize
    adjustSliderHeight();
    window.addEventListener("resize", adjustSliderHeight);
});


document.getElementById('prioritySlider').addEventListener('input', (event) => {
    const newPriority = event.target.value;
    loadTasksView();
    if (highlightedTaskId) {
        fetch(`/api/tasks/${highlightedTaskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ priority: newPriority })
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to update task');
            return response.json();
        })
        .then(updatedTask => {
            console.log("Priority updated:", updatedTask.priority);
            loadTasksView(); // Reload to reflect updates
            drawDots([updatedTask]); // Update dot position on matrix
        })
        .catch(error => console.error('Error updating priority:', error));
    }
});
document.addEventListener('DOMContentLoaded', () => {
    const calendarDays = document.getElementById('calendarDays');
    const monthYear = document.getElementById('monthYear');
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    
   
    
    renderCalendarb(currentMonth, currentYear);
});
function changeMonth(offset) {
    week += offset;
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    renderCalendarb(currentMonth, currentYear);
}
function renderCalendarb(month, year) {
    calendarDays.innerHTML = '';
    
    
    const today = new Date();
    const oneWeek = 7 * 24 * 60 * 60 * 1000; // One week in milliseconds
    const lastSunday = (new Date(today.setDate(today.getDate() - today.getDay())));
    lastSunday.setDate(lastSunday.getDate() + (7 * week));
    const lastSundayDay = lastSunday.getDate();
    let tmonth = lastSunday.getMonth();
    let tyear = lastSunday.getFullYear();
    
  

    
    monthYear.textContent = new Date(tyear, tmonth).toLocaleString('default', { month: 'long', year: 'numeric' });
    let bofa;
    deez = false;
    for (let i = 0; i < 7; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('day');
        
        
        let temp = new Date(lastSunday);
        temp.setDate(temp.getDate() + i);
        bol = temp.toISOString().split('T')[0];
        emptyCell.textContent = temp.getDate();
        fetch(`/api/tasks/date/${(bol)}`)
            .then(response => response.json())
            .then(tasks => {
                tasks.forEach(task => {
                   if (i ==5 && !deez){
                    bofa = task.content;
                    deez = true;
                }
                    console.log("FFFFFFFFFFFFFFFUUUUUUUCK");
                   console.log(temp);
                    const calButton = document.createElement('button');
                    calButton.classList.add('task-cal');
                    calButton.style.backgroundColor = task.color || '#ccc';
                    calButton.setAttribute('data-task-id', task.id);
                    calButton.setAttribute('task-desc', task.content);

                    
                    calButton.onclick = (e) => {
                        
                        e.stopPropagation();
                        handleTaskClick(calButton);
                    const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
                    handleTaskClick(taskElement);
                    };  
                    emptyCell.appendChild(calButton);
                });
            })
            .catch(error => alert('Error fetching tasks:', error));
            
        fetch(`/api/events/active/${bol}`)
        .then(response => response.json())
        .then(events => {
            events.forEach(event => {
                const eventButton = document.createElement('button');
                eventButton.classList.add('event-cal');
                eventButton.style.backgroundColor = '#000'; // Black color for events
                eventButton.setAttribute('data-event-id', event.id);
                eventButton.setAttribute('event-desc', event.title);

                eventButton.onclick = (e) => {
                    e.stopPropagation();
                    handleEventClick(eventButton);
                    const eventElement = document.querySelector(`[data-event-id="${event.id}"]`);
                    handleEventClick(eventElement);
                };
                emptyCell.appendChild(eventButton);
            });
        })
        .catch(error => alert('Error fetching events:', error));

  

        calendarDays.appendChild(emptyCell);
    }
}
function loadEventsView() {
        fetch('/api/events')
            .then(response => response.json())
            .then(events => {
                console.log('events imported')
                const eventList = document.getElementById('eventList');
                eventList.innerHTML = '';  // Clear the list before re-populating it
    
                events.forEach(event => {
                    const li = document.createElement('li');
                    li.setAttribute('data-event-id', event.id);
                    li.classList.add('event-item');
    
                    // Event Details Container
                    const detailsDiv = document.createElement('div');
                    detailsDiv.classList.add('event-details');
    
                    // Event Content
                    const contentP = document.createElement('p');
                    contentP.textContent = `Event: ${event.title}`;
                    detailsDiv.appendChild(contentP);
    
                    // Location (if exists)
                    if (event.location) {
                        const locationP = document.createElement('p');
                        locationP.textContent = `Location: ${event.location}`;
                        detailsDiv.appendChild(locationP);
                    }
    
                    // Date and Time (if exists)
                    if (event.date || event.time) {
                        const dateP = document.createElement('p');
                        let dateText = 'Date: ';
                        if (event.date) {
                            console.log(event.date);
                            dateText += `${event.date}`;
                        }
                        if (event.time) {
                            dateText += ` at ${event.time}`;
                        }
                        dateP.textContent = dateText;
                        detailsDiv.appendChild(dateP);
                    }
    
                    li.appendChild(detailsDiv);
    
                    // Event Color Button
                    const colorButton = document.createElement('button');
                    colorButton.classList.add('event-color');
                    colorButton.style.backgroundColor = event.color || '#ccc';
                    colorButton.setAttribute('data-event-id', event.id);
                    colorButton.onclick = (e) => {
                        e.stopPropagation();
                        openEditFormEdit(event, colorButton, li);
                    };
    
                    li.appendChild(colorButton);
    
                    // Add event listener for highlighting the event container (li)
                    li.onclick = () => handleEventClick(li);
    
                    eventList.appendChild(li);
                });
            })
            .catch(error => console.error('Error loading events:', error));
    }

    function filterEvents() {
        const searchInput = document.getElementById('eventSearchInput').value.toLowerCase();
        const eventItems = document.querySelectorAll('#eventList li');
    
        eventItems.forEach(eventItem => {
            const eventContent = eventItem.querySelector('.event-details p').textContent.toLowerCase();
            if (eventContent.includes(searchInput)) {
                eventItem.style.display = '';
            } else {
                eventItem.style.display = 'none';
            }
        });
    }
    
    function handleEventClick(eventElement) {
        // First, remove the "highlighted" class from all event elements
        const allEvents = document.querySelectorAll('.event-item');
        allEvents.forEach(event => {
            event.classList.remove('highlighted');  // Remove the "highlighted" class from each event
        });
    
        // Then, add the "highlighted" class to the clicked event
        highlightedEventId = eventElement.getAttribute('data-event-id');
        eventElement.classList.add('highlighted');
    }
    
    // Load events when the page loads
    document.addEventListener("DOMContentLoaded", () => {
        loadEventsView();
       
    });
    function toggleSidebar() {
        const taskSidebar = document.getElementById('sidebar');
        const eventSidebar = document.getElementById('eventSidebar');
        if (taskSidebar.style.display === 'none') {
            taskSidebar.style.display = 'block';
            eventSidebar.style.display = 'none';
        } else {
            taskSidebar.style.display = 'none';
            eventSidebar.style.display = 'block';
        }
    }
   
    function openEditFormEdit(event) {
        document.getElementById('editTaskFormContainer').style.display = 'none';
        const formContainer = document.getElementById('editEventFormContainer');
        const matrix = document.getElementById('matrixContainer');
        formContainer.style.display = 'block';
        matrix.style.display = 'none'; // Hide matrix when form is shown
        console.log(event.edate);
        console.log(event.etime);
        document.getElementById('editEventId').value = event.id;
        document.getElementById('editEventInput').value = event.title;
        document.getElementById('editEventLocation').value = event.location || '';
        document.getElementById('editEventDueDate').value = event.date.split('T')[0] ;
        document.getElementById('editEventDueTime').value = event.time;
        document.getElementById('editEventEndDate').value = event.eDate;
        document.getElementById('editEventEndTime').value = event.eTime;
    }
    
    function closeEditFormView() {
        const taskFormContainer = document.getElementById('editTaskFormContainer');
        const eventFormContainer = document.getElementById('editEventFormContainer');
        const matrix = document.getElementById('matrixContainer');
        taskFormContainer.style.display = 'none';
        eventFormContainer.style.display = 'none';
        matrix.style.display = 'block'; // Show matrix when form is hidden
    }
    
    function editEventView() {
        const eventId = document.getElementById('editEventId').value;
        const eventContent = document.getElementById('editEventInput').value;
        const eventLocation = document.getElementById('editEventLocation').value;
        const eventDueDate = document.getElementById('editEventDueDate').value;
        const eventDueTime = document.getElementById('editEventDueTime').value;
        const eventEndTime = document.getElementById('editEventEndTime').value;
        const eventEndDate = document.getElementById('editEventEndDate').value;
    
        fetch(`/api/events/${eventId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: eventContent,
                location: eventLocation,
                date: eventDueDate,
                time: eventDueTime,
                eTime: eventEndTime,
                eDate: eventEndDate
            })
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to update event');
            return response.json();
        })
        .then(updatedEvent => {
            console.log("Event updated:", updatedEvent);
            loadEventsView(); // Reload to reflect updates
            closeEditFormView(); // Close the form
        })
        .catch(error => console.error('Error updating event:', error));
    } 

