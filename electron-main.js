const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let mainWindow; // Declare as let here
let flask; // Store the Flask process

function createWindow() {
    mainWindow = new BrowserWindow({  // Use the global mainWindow variable
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    // Load the Flask app URL
    mainWindow.loadURL('http://127.0.0.1:5000/');

    // Handle the download using Electron's session
    session.defaultSession.on('will-download', (event, item, webContents) => {
        // Set the file save path to a user-specified location
        const savePath = dialog.showSaveDialogSync(mainWindow, {
            title: 'Save File',
            defaultPath: path.join(app.getPath('downloads'), item.getFilename())
        });

        if (savePath) {
            // Allow the download and set the path
            item.setSavePath(savePath);
        } else {
            // Cancel the download if no path is selected
            item.cancel();
        }
    });

    // Close event listener
    mainWindow.on('closed', () => {
        // Clear the reference
        mainWindow = null;  
        if (flask) {
            flask.kill(); // Kill the Flask process
            flask = null;
        }
        app.quit(); // Ensure the Electron app quits
    });
}

app.whenReady().then(() => {
    // Start the Flask server
    flask = spawn('python', [path.join(__dirname, 'app.py')]);

    // Optional: Log server output
    flask.stdout.on('data', (data) => {
        console.log(`Flask server: \n${data}`);
    });

    flask.stderr.on('data', (data) => {
        console.error(`Flask server error: ${data}`);
    });

    // Wait a few seconds for the server to start (or use a more robust check)
    setTimeout(() => {
        createWindow();
    }, 2000); // Adjust the delay as needed
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => { // Graceful shutdown
    if (flask) {
        flask.kill();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

