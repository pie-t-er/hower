const { app, BrowserWindow, ipcMain, Notification, session } = require('electron');
const axios = require('axios');
const path = require('path');

let mainWindow;
let isUserLoggedIn = false;
let scheduledNotifications = {};

app.setAppUserModelId('com.hower.app'); // Set your App User Model ID

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true, // Consider using a preload script for better security
      contextIsolation: false,
    },
  });

  mainWindow.loadURL('http://127.0.0.1:5000/login');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

ipcMain.on('login-success', () => {
  console.log('User has logged in');
  isUserLoggedIn = true;
  fetchAndScheduleNotifications();
});

ipcMain.on('logout', () => {
  console.log('User has logged out');
  isUserLoggedIn = false;

  // Clear scheduled notifications
  for (let id in scheduledNotifications) {
    clearTimeout(scheduledNotifications[id]);
  }
  scheduledNotifications = {};
});

ipcMain.on('new-task-added', (event, newTask) => {
  console.log(`New task added: ${newTask.task}`);

  // Schedule notification for the new task
  scheduleNotificationForItem(newTask);
});

ipcMain.on('new-event-added', (event, newEvent) => {
  console.log(`New event added: ${newEvent.event}`);

  // Schedule notification for the new event
  scheduleNotificationForItem(newEvent);
});

async function getSessionCookies() {
  return new Promise((resolve, reject) => {
    session.defaultSession.cookies
      .get({})
      .then(cookies => {
        const sessionCookies = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
        resolve(sessionCookies);
      })
      .catch(error => {
        console.error('Error getting cookies:', error);
        reject(error);
      });
  });
}

async function fetchAndScheduleNotifications() {
  if (!isUserLoggedIn) {
    console.log('User is not logged in. Skipping fetch.');
    return;
  }

  try {
    const sessionCookies = await getSessionCookies();

    const axiosInstance = axios.create({
      withCredentials: true,
      headers: {
        Cookie: sessionCookies,
      },
    });

    const tasksResponse = await axiosInstance.get('http://127.0.0.1:5000/api/tasks');
    const eventsResponse = await axiosInstance.get('http://127.0.0.1:5000/api/events');

    const tasks = tasksResponse.data;
    const events = eventsResponse.data;

    // Set the type for each item
    tasks.forEach(task => (task.type = 'task'));
    events.forEach(event => (event.type = 'event'));

    const items = [...tasks, ...events];

    scheduleNotifications(items);
  } catch (error) {
    console.error('Error fetching tasks and events:', error);
  }
}

function scheduleNotifications(items) {
  // Clear previous timeouts
  for (let id in scheduledNotifications) {
    clearTimeout(scheduledNotifications[id]);
  }
  scheduledNotifications = {};

  items.forEach(item => {
    scheduleNotificationForItem(item);
  });
}

function scheduleNotificationForItem(item) {
  const now = new Date();
  let notifyTime;
  let title;
  let body;

  if (item.type === 'task' && item.due_date && item.due_time && item.notification_offset !== null) {
    const dueDateTime = new Date(`${item.due_date}T${item.due_time}`);
    notifyTime = new Date(dueDateTime.getTime() - item.notification_offset * 60000);
    title = `Task Due in ${item.notification_offset} minutes`;
    body = `Task: ${item.task}\nPriority: ${item.priority}`;
  } else if (item.type === 'event' && item.date && item.time && item.notification_offset !== null) {
    const eventDateTime = new Date(`${item.date}T${item.time}`);
    notifyTime = new Date(eventDateTime.getTime() - item.notification_offset * 60000);
    title = `Event Starts in ${item.notification_offset} minutes`;
    body = `Event: ${item.event}`;
  } else {
    // Skip items without necessary data
    return;
  }

  // Only schedule future notifications
  if (notifyTime > now) {
    const timeout = notifyTime.getTime() - now.getTime();

    const minutesUntilNotification = Math.round(timeout / 60000);

    const timeoutId = setTimeout(() => {
      showCustomNotification(title, body);
      console.log(`Notification shown for item ID ${item.id} at ${new Date().toLocaleString()}`);
    }, timeout);

    scheduledNotifications[item.id] = timeoutId;

    console.log(
      `Notification for new ${item.type} "${item.type === 'task' ? item.task : item.event}" scheduled to show in ${minutesUntilNotification} minutes.`
    );
  } else {
    console.log(`Notification time for new ${item.type} "${item.type === 'task' ? item.task : item.event}" has already passed.`);
  }
}

function showCustomNotification(title, body) {
  const options = {
    title: title,
    body: body,
    silent: false,
    icon: path.join(__dirname, 'assets', 'image.png'), // Replace with your icon path
    timeoutType: 'default',
  };

  const notification = new Notification(options);

  notification.show();

  notification.on('show', () => {
    console.log(`Notification displayed: ${title}`);
  });

  notification.on('click', () => {
    console.log('Notification clicked');
    if (mainWindow) {
      mainWindow.show();
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  // Periodically fetch and schedule notifications
  setInterval(() => {
    if (isUserLoggedIn) {
      fetchAndScheduleNotifications();
    }
  }, 5 * 60 * 1000); // Every 5 minutes
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
