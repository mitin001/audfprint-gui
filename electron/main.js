// Modules to control application life and create native browser window
require('dotenv').config();
const {
  app, ipcMain, Menu, dialog, shell,
} = require('electron');
const { autoUpdater } = require('electron-updater');
const { join, parse, basename } = require('path');
const { existsSync } = require('fs');
const log = require('electron-log');
const os = require('os');
const glob = require('glob');
const find = require('findit');
const { PythonShell } = require('python-shell');
const openAboutWindow = require('about-window').default;
const { createAppWindow, isMainWindowDefined, sendToMainWindow } = require('./main/app-process');

let audfprintVersion = null;
let pythonVersion = null;
let pythonPath = null;

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

const getAudfprintPath = () => {
  const path = app.getAppPath();
  const pathUnpacked = `${path}.unpacked`;
  if (existsSync(pathUnpacked)) {
    return join(pathUnpacked, 'build', 'audfprint');
  }
  return join(path, 'build', 'audfprint');
};

const getPrecomputePath = () => {
  const path = app.getAppPath();
  const pathUnpacked = `${path}.unpacked`;
  if (existsSync(pathUnpacked)) {
    return join(pathUnpacked, 'precompute');
  }
  return join(path, 'precompute');
};

const getAudfprintScript = (argv) => {
  const path = getAudfprintPath();
  const quotedDependencyPath = JSON.stringify(path);
  const quotedArgv = ['audfprint', ...argv].map((arg) => JSON.stringify(arg));
  return `
    import sys
    sys.path.append(${quotedDependencyPath})
    from audfprint import main
    if __name__ == "__main__":
        main([${quotedArgv.join(',')}])
  `.replace(/\n\s{4}/g, '\n');
};

const getPipScript = () => {
  const path = getAudfprintPath();
  const quotedDependencyPath = JSON.stringify(path);
  const quotedReqPath = JSON.stringify(join(path, 'requirements.txt'));
  return `
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", ${quotedReqPath}, "-t", ${quotedDependencyPath}, "--no-user"])
  `.replace(/\n\s{4}/g, '\n');
};

const getPythonLocation = (root, pyName) => new Promise((resolve) => {
  const finder = find(root);
  finder.on('file', (file) => {
    const name = basename(file);
    if (name === pyName) {
      resolve(file);
    }
  });
  finder.on('link', (link) => {
    const name = basename(link);
    if (name === pyName) {
      resolve(link);
    }
  });
  finder.on('directory', (dir, stat, stop) => {
    if (dir === root) {
      return;
    }
    if (!/python/.test(dir)) {
      stop();
    }
  });
  finder.on('error', () => {
    resolve(null);
  });
  finder.on('end', () => {
    resolve(null);
  });
});

const checkDependencies = (counter) => {
  const handlePythonError = async (error) => {
    if (process.platform === 'darwin') {
      const pythonLocations = await Promise.all([
        '/usr/local/Cellar', // Python installed by Homebrew but not linked in PATH
        '/Library/Frameworks/Python.framework/Versions', // python installed via .pkg
      ].map((root) => getPythonLocation(root, 'python3')));
      pythonLocations.forEach((location) => {
        if (location) {
          pythonPath = location;
        }
      });
    }
    if (pythonPath) {
      if (!counter) { // retry only once
        checkDependencies(1);
        return;
      }
    }
    const lines = [
      'You will be taken to the download page for Python.',
      error.toString(),
    ];
    dialog.showMessageBox({
      title: 'Python not installed',
      message: 'Python is required for this application.',
      detail: lines.join('\n'),
    }).then(() => {
      shell.openExternal('https://www.python.org/downloads/').then(() => app.quit());
    });
  };

  PythonShell.getVersion(pythonPath).then(({ stdout }) => {
    const code = getAudfprintScript(['--version']);

    pythonVersion = stdout.trim();

    PythonShell.runString(code, { pythonPath }, (error, version) => {
      if (!error) {
        audfprintVersion = version;
        return;
      }
      if (error.toString().indexOf('ModuleNotFoundError') !== -1) {
        sendToMainWindow('installationStatusChanged', { installing: true });

        PythonShell.runString(getPipScript(), { pythonPath }, (pipError) => {
          if (!pipError) {
            sendToMainWindow('installationStatusChanged', { installing: false });
            return;
          }
          dialog.showErrorBox('Installation error', pipError.toString());
        });
      } else {
        dialog.showErrorBox('Error', error.toString());
      }
    }).on('error', async (error) => {
      await handlePythonError(error);
    });
  }).catch(async (error) => {
    await handlePythonError(error);
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
      label: 'Audio Fingerprinter',
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
      const winFilenames = filenames.map((filename) => filename.replace(/\//g, '\\'));
      sendToMainWindow('audioDirectoryOpened', {
        root,
        filenames: process.platform === 'win32' ? winFilenames : filenames,
        maxCores: os.cpus().length,
        platform: process.platform,
      });
    });
  });
});

ipcMain.on('openAudioFile', () => {
  dialog.showOpenDialog({
    properties: ['openFile'],
  }).then(({ filePaths }) => {
    const [filename] = filePaths || [];
    const winFilename = filename.replace(/\//g, '\\');
    const sourceFilename = process.platform === 'win32' ? winFilename : filename;
    const code = getAudfprintScript(['precompute', '-p', getPrecomputePath(), '-i', 4, sourceFilename]);
    sendToMainWindow('pythonOutput', { line: 'Analyzing...' });
    PythonShell.runString(code, { pythonOptions: ['-u'], pythonPath }, (error) => {
      if (!error) {
        return;
      }
      sendToMainWindow('pythonOutput', { line: error.toString(), error: true });
    }).on('message', (message) => {
      let error;
      if (/Error/.test(message)) {
        error = true;
      }
      sendToMainWindow('pythonOutput', { line: message, error });
    });
  });
});

ipcMain.on('storeDatabase', (event, options) => {
  const { root, filenames, cores } = options || {};
  const { base: defaultPath } = parse(root) || {};

  dialog.showSaveDialog({ defaultPath }).then(({ filePath, canceled }) => {
    if (canceled) {
      return;
    }
    const { ext } = parse(filePath) || {};
    const saveAs = ext ? filePath : `${filePath}.pklz`;
    const code = getAudfprintScript(['new', '-C', '-H', cores, '-d', saveAs, ...filenames]);

    sendToMainWindow('pythonOutput', { line: 'Fingerprinting...' });
    PythonShell.runString(code, { pythonOptions: ['-u'], pythonPath }, (error) => {
      if (!error) {
        return;
      }
      sendToMainWindow('pythonOutput', { line: error.toString(), error: true });
    }).on('message', (message) => {
      let error;
      if (/Error/.test(message)) {
        error = true;
      }
      sendToMainWindow('pythonOutput', { line: message, error });
    });
  });
});

ipcMain.on('checkDependencies', () => checkDependencies());

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
