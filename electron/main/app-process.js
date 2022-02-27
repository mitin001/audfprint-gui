const { BrowserWindow } = require('electron');

// Working with locale files.
const path = require('path');
const url = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createAppWindow() {
  // If a URL exists in the environment, we assume we're under development.
  // Otherwise, we construct a URL using the file protocol
  const startUrl = process.env.REACT_APP_URL || url.format({
    pathname: path.join(__dirname, '../../index.html'),
    protocol: 'file:',
    slashes: true,
  });

  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 600,
    minHeight: 600,
    minWidth: 800,
    width: 800,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  // mainWindow.loadFile('index.html')
  mainWindow.loadURL(startUrl);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

function isMainWindowDefined() {
  return !!mainWindow;
}

function sendToMainWindow(channel, message) {
  if (mainWindow && mainWindow.webContents && typeof mainWindow.webContents.send === 'function') {
    mainWindow.webContents.send(channel, message);
  }
}

module.exports = { createAppWindow, isMainWindowDefined, sendToMainWindow };
