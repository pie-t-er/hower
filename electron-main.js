const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let mainWindow;
let flask;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    // Load the login page first
    mainWindow.loadURL('http://127.0.0.1:5000/login');

    mainWindow.on('closed', () => {
        mainWindow = null;
        if (flask) {
            flask.kill();
            flask = null;
        }
        app.quit();
    });
}

app.whenReady().then(() => {
    flask = spawn('python', [path.join(__dirname, 'app.py')]);
    flask.stdout.on('data', (data) => {
        console.log(`Flask server: \n${data}`);
    });
    flask.stderr.on('data', (data) => {
        console.error(`Flask server error: ${data}`);
    });

    setTimeout(() => {
        createWindow();
    }, 2000);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    if (flask) {
        flask.kill();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});