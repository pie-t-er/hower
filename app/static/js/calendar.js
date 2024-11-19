const timeSlots = [
  "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
  "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM",
  "11:00 PM", "12:00 AM"
];

// Sample events data - in a real app, this would come from your Flask backend
const events = [
  {
      id: 1,
      title: "Team Meeting",
      time: "9:00 AM",
      date: "2024-11-18"
  },
  {
      id: 2,
      title: "Client Call",
      time: "2:00 PM",
      date: "2024-11-20"
  }
];

let currentDate = new Date();

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function getDayName(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function getMonthDay(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getEventsForDateAndTime(date, time) {
  const dateStr = formatDate(date);
  return events.filter(event => event.date === dateStr && event.time === time);
}

function renderWeek() {
  const headerContainer = document.querySelector('.timeline-header');
  const bodyContainer = document.getElementById('timeline-body');
  
  // Clear previous content
  while (headerContainer.children.length > 1) {
      headerContainer.removeChild(headerContainer.lastChild);
  }
  bodyContainer.innerHTML = '';

  // Get Sunday of current week
  const sunday = new Date(currentDate);
  sunday.setDate(currentDate.getDate() - currentDate.getDay());

  // Create day headers
  for (let i = 0; i < 7; i++) {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + i);
      const isToday = formatDate(date) === formatDate(new Date());
      
      const dayHeader = document.createElement('div');
      dayHeader.className = `day-header ${isToday ? 'today' : ''}`;
      dayHeader.innerHTML = `
          <div class="day-name">${getDayName(date)}</div>
          <div class="day-date">${getMonthDay(date)}</div>
      `;
      headerContainer.appendChild(dayHeader);
  }

  // Create time slots and day columns
  timeSlots.forEach(time => {
      // Add time slot
      const timeSlotDiv = document.createElement('div');
      timeSlotDiv.className = 'time-slot';
      timeSlotDiv.textContent = time;
      bodyContainer.appendChild(timeSlotDiv);

      // Add day columns for this time slot
      for (let i = 0; i < 7; i++) {
          const date = new Date(sunday);
          date.setDate(sunday.getDate() + i);
          const isToday = formatDate(date) === formatDate(new Date());
          
          const dayColumn = document.createElement('div');
          dayColumn.className = `day-column ${isToday ? 'today' : ''}`;

          // Add events for this time slot
          const slotEvents = getEventsForDateAndTime(date, time);
          slotEvents.forEach(event => {
              const eventDiv = document.createElement('div');
              eventDiv.className = 'event';
              eventDiv.innerHTML = `
                  <div class="event-title">${event.title}</div>
              `;
              dayColumn.appendChild(eventDiv);
          });

          // Add "+" button
          const addButton = document.createElement('button');
          addButton.className = 'add-event';
          addButton.innerHTML = '+';
          addButton.onclick = () => addEvent(formatDate(date), time);
          dayColumn.appendChild(addButton);

          bodyContainer.appendChild(dayColumn);
      }
  });
}

function previousWeek() {
  currentDate.setDate(currentDate.getDate() - 7);
  renderWeek();
}

function nextWeek() {
  currentDate.setDate(currentDate.getDate() + 7);
  renderWeek();
}

function addEvent(date, time) {
  // In a real app, this would open a modal or form
  alert(`Add event for ${date} at ${time}`);
  // You would then send the new event data to your Flask backend
}

// Initial render
renderWeek();