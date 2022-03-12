// Modules to control application life and create native browser window
require('dotenv').config();
const {
  app, ipcMain, Menu, dialog, shell,
} = require('electron');
const { autoUpdater } = require('electron-updater');
const { join } = require('path');
const { existsSync } = require('fs');
const log = require('electron-log');
const os = require('os');
const glob = require('glob');
const { PythonShell } = require('python-shell');
const openAboutWindow = require('about-window').default;
const { createAppWindow, isMainWindowDefined, sendToMainWindow } = require('./main/app-process');

let audfprintVersion = null;
let pythonVersion = null;

const getAboutWindowOptions = () => {
  const packageJsonDir = join(__dirname, '..');
  const prodIconPath = join(packageJsonDir, 'icon.png');
  const devIconPath = join(packageJsonDir, 'build/icon.png');
  const descriptionLines = [
    `Python version: ${pythonVersion}`,
    `audfprint version: ${audfprintVersion}`,
  ];
  const aboutWindowOptions = { description: descriptionLines.join('\n'), icon_path: '' };
  if (existsSync(devIconPath)) {
    aboutWindowOptions.icon_path = devIconPath;
    aboutWindowOptions.package_json_dir = packageJsonDir;
  } else {
    aboutWindowOptions.icon_path = prodIconPath;
  }
  return aboutWindowOptions;
};

const getAudfprintScript = (argv) => {
  const path = app.getAppPath();
  const quotedDependencyPath = JSON.stringify(`${path}/public/audfprint`);
  const quotedArgv = ['audfprint', ...argv].map((arg) => JSON.stringify(arg));
  return `
    import sys
    sys.path.append(${quotedDependencyPath})
    from audfprint import main
    main([${quotedArgv.join(',')}])
  `.replace(/\n\s+/g, '\n');
};

const getPipScript = () => {
  const path = app.getAppPath();
  const quotedReqPath = JSON.stringify(`${path}/public/audfprint/requirements.txt`);
  const quotedDependencyPath = JSON.stringify(`${path}/public/audfprint`);
  return `
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", ${quotedReqPath}, "-t", ${quotedDependencyPath}, "--no-user"])
  `.replace(/\n\s+/g, '\n');
};

const handlePythonError = (error) => {
  const lines = [
    'You will be taken to the download page for Python.',
    error.toString(),
  ];
  dialog.showMessageBox({
    title: 'Python not installed',
    message: 'Python is required for this application.',
    detail: lines.join('\n'),
  }).then(() => {
    shell.openExternal('https://www.python.org/downloads/');
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  const template = [
    {
      label: 'File',
      role: 'filemenu',
    },
    {
      label: 'Edit',
      role: 'editmenu',
    },
    {
      label: 'View',
      role: 'viewmenu',
    },
    {
      label: 'Window',
      role: 'windowmenu',
    },
    {
      label: 'Help',
      role: 'help',
      submenu: [
        {
          label: 'About',
          click: () => openAboutWindow(getAboutWindowOptions()),
        },
        {
          label: 'Quit',
          role: 'quit',
        },
      ],
    },
  ];
  if (process.platform === 'darwin') {
    template.unshift({
      label: 'audfprint GUI',
      role: 'appmenu',
    });
  }
  app.applicationMenu = Menu.buildFromTemplate(template);
  createAppWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (!isMainWindowDefined()) {
    createAppWindow();
  }
});

// Start logging
log.transports.file.level = 'debug';
autoUpdater.logger = log;

log.hooks.push((message, transport) => {
  if (transport !== log.transports.file) {
    return message;
  }
  sendToMainWindow('log', message);
  return message;
});
ipcMain.on('logStored', (event, storedLog) => {
  sendToMainWindow('logStored', storedLog);
});

// After the user logs in to the app and has the token, use it to check for updates
ipcMain.on('checkForUpdates', () => {
  autoUpdater.setFeedURL({
    owner: 'mitin001',
    provider: 'github',
    repo: 'audfprint-gui',
  });
  autoUpdater.checkForUpdates();
});

ipcMain.on('openAudioDirectory', () => {
  dialog.showOpenDialog({
    properties: ['openDirectory'],
  }).then(({ filePaths }) => {
    const [root] = filePaths || [];
    glob(`${root}/**/*`, (error, filenames) => {
      sendToMainWindow('audioDirectoryOpened', {
        root,
        filenames,
        maxCores: os.cpus().length,
      });
    });
  });
});

ipcMain.on('storeDatabase', (event, options) => {
  const { root, filenames, cores } = options || {};
  const [, dir] = root.match(/.+\/(.+)$/);
  const code = getAudfprintScript(['new', '-d', `${root}/${dir}.pklz`, '-H', cores, ...filenames]);

  PythonShell.runString(code, { pythonOptions: ['-u'] }, (error) => {
    if (!error) {
      return;
    }
    sendToMainWindow('pythonOutput', error.toString());
  }).on('message', (message) => {
    sendToMainWindow('pythonOutput', message);
  });
});

ipcMain.on('checkDependencies', () => {
  PythonShell.getVersion().then(({ stdout }) => {
    const code = getAudfprintScript(['--version']);

    pythonVersion = stdout.trim();

    PythonShell.runString(code, null, (error, version) => {
      if (!error) {
        audfprintVersion = version;
        return;
      }
      if (error.toString().indexOf('ModuleNotFoundError') !== -1) {
        sendToMainWindow('installationStatusChanged', { installing: true });

        PythonShell.runString(getPipScript(), null, (pipError) => {
          if (!pipError) {
            sendToMainWindow('installationStatusChanged', { installing: false });
            return;
          }
          dialog.showErrorBox('Installation error', pipError.toString());
        });
      } else {
        dialog.showErrorBox('Error', error.toString());
      }
    }).on('error', (error) => {
      handlePythonError(error);
    });
  }).catch((error) => {
    handlePythonError(error);
  });
});

autoUpdater.on('download-progress', (progress) => {
  sendToMainWindow('updateDownloadProgress', progress);
});

autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
  const dialogOpts = {
    type: 'info',
    buttons: ['Restart', 'Later'],
    title: 'Application Update',
    message: process.platform === 'win32' ? releaseNotes : releaseName,
    detail: 'A new version has been downloaded. Restart the application to apply the updates.',
  };

  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

ipcMain.on('quitAndInstall', () => {
  autoUpdater.quitAndInstall();
});
