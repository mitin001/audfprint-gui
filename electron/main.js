// Modules to control application life and create native browser window
require('dotenv').config();
const {
  app, ipcMain, Menu, dialog, shell,
} = require('electron');
const { autoUpdater } = require('electron-updater');
const { join, parse, basename } = require('path');
const {
  promises: {
    readFile, writeFile, rm, rename, mkdir,
  },
  existsSync, createWriteStream,
} = require('fs');
const log = require('electron-log');
const os = require('os');
const glob = require('glob');
const find = require('findit');
const cp = require('cp');
const { PythonShell } = require('python-shell');
const openAboutWindow = require('about-window').default;
const anyAscii = require('any-ascii');
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
  const path = app.getPath('userData');
  const pathUnpacked = `${path}.unpacked`;
  if (existsSync(pathUnpacked)) {
    return join(pathUnpacked, 'precompute');
  }
  return join(path, 'precompute');
};

const getDatabasePath = () => {
  const path = app.getPath('userData');
  const pathUnpacked = `${path}.unpacked`;
  if (existsSync(pathUnpacked)) {
    return join(pathUnpacked, 'databases');
  }
  return join(path, 'databases');
};

const getAsciiPath = () => {
  const path = app.getPath('userData');
  const pathUnpacked = `${path}.unpacked`;
  if (existsSync(pathUnpacked)) {
    return join(pathUnpacked, 'ascii');
  }
  return join(path, 'ascii');
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

const getAudfprintScriptForDir = (dir, argv) => {
  const path = getAudfprintPath();
  const quotedDir = JSON.stringify(dir);
  const quotedDependencyPath = JSON.stringify(path);
  const quotedArgv = ['audfprint', ...argv].map((arg) => JSON.stringify(arg));
  return `
    import os
    import sys
    sys.path.append(${quotedDependencyPath})
    from audfprint import main
    os.chdir(${quotedDir})
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

const listFiles = (root, ext) => new Promise((resolve) => {
  const results = [];
  const finder = find(root);
  finder.on('file', (file) => {
    if (file.indexOf(ext) !== -1) {
      results.push({ basename: basename(file, ext), fullname: file });
    }
  });
  finder.on('error', () => {
    resolve(results);
  });
  finder.on('end', () => {
    resolve(results);
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

const sendPythonOutput = (header, code) => new Promise((resolve) => {
  sendToMainWindow('pythonOutput', { line: header });
  PythonShell.runString(code, { pythonOptions: ['-u'], pythonPath }, (error, output) => {
    if (!error) {
      return resolve(output);
    }
    sendToMainWindow('pythonOutput', { line: error.toString(), error: true });
    return resolve(output);
  }).on('message', (message) => {
    let error;
    if (/Error/.test(message)) {
      error = true;
    }
    sendToMainWindow('pythonOutput', { line: message, error });
  });
});

const processMatchLine = async (line, dbName, precomputePaths) => {
  const precomputePath = precomputePaths.find((path) => line.indexOf(path) !== -1);
  if (!precomputePath) {
    return;
  }
  const jsonPath = precomputePath.replace(/\.afpt$/, '.json');
  try {
    const contents = await readFile(jsonPath, 'utf-8');
    const analysis = JSON.parse(contents.toString());
    const { parsedMatchesByDatabase = {}, matchesByDatabase = {} } = analysis || {};
    if (!matchesByDatabase[dbName]) {
      matchesByDatabase[dbName] = [];
    }
    matchesByDatabase[dbName].push(line);
    const [
      isMatch,
      matchDuration, matchStartInQuery, matchStartInFingerprint, matchFilename,
      commonHashNumerator, commonHashDenominator, rank,
    ] = line.match(/^Matched (.+) s starting at (.+) s in .+ to time (.+) s in (.+) with (.+) of (.+) common hashes at rank (.+)$/) || [];
    if (isMatch) {
      parsedMatchesByDatabase[dbName] = {
        matchDuration: matchDuration.trim(),
        matchStartInQuery: matchStartInQuery.trim(),
        matchStartInFingerprint: matchStartInFingerprint.trim(),
        matchFilename: matchFilename.trim(),
        commonHashNumerator: commonHashNumerator.trim(),
        commonHashDenominator: commonHashDenominator.trim(),
        rank: rank.trim(),
      };
    }
    await writeFile(jsonPath, JSON.stringify({ ...analysis, matchesByDatabase, parsedMatchesByDatabase }));
  } catch (e) {
    // ignore errors
  }
};

const match = async (dbName, dbFilename, precomputePaths) => {
  const matchCode = getAudfprintScript(['match', '-d', dbFilename, ...precomputePaths, '-R']);
  const matchLines = await sendPythonOutput('Matching...', matchCode);
  matchLines.reduce(
    (p, line) => p.then(() => processMatchLine(line, dbName, precomputePaths)),
    Promise.resolve(),
  );
};

const copySync = (src, dest) => {
  sendToMainWindow('pythonOutput', { line: `Copying ${src}...` });
  cp.sync(src, dest);
};

const processNewDatabase = async (filename, precomputePaths) => {
  const listCode = getAudfprintScript(['list', '-d', filename]);
  const metadataFilename = filename.replace('.pklz', '.txt');

  PythonShell.runString(listCode, { pythonPath }, (error, output) => {
    const file = createWriteStream(metadataFilename);
    if (error) {
      file.write(error.toString());
    } else {
      output.forEach((line) => {
        file.write(`${line}\n`);
      });
    }
    file.end();
  });

  const dbName = basename(filename, '.pklz');
  await match(dbName, filename, precomputePaths);
};

const analyzeWinAscii = async (filename, baseFilenameAscii) => {
  const asciiDir = getAsciiPath();
  const asciiFilename = join(asciiDir, baseFilenameAscii);
  if (!existsSync(asciiDir)) {
    await mkdir(asciiDir);
  }
  copySync(filename, asciiFilename);
  const code = getAudfprintScript(['precompute', '-i', 4, asciiFilename]);
  return sendPythonOutput('Analyzing...', code);
};

const analyzeWin = async (filename) => {
  const baseFilename = basename(filename);
  const baseFilenameAscii = anyAscii(baseFilename).replace(/[<>:"|?*/\\]/g, '');
  if (baseFilename !== baseFilenameAscii) {
    return analyzeWinAscii(filename, baseFilenameAscii);
  }
  const code = getAudfprintScript(['precompute', '-i', 4, filename.replace(/\//g, '\\')]);
  return sendPythonOutput('Analyzing...', code);
};

const analyze = async (filename) => {
  if (process.platform === 'win32') {
    return analyzeWin(filename);
  }
  const code = getAudfprintScript(['precompute', '-i', 4, filename]);
  return sendPythonOutput('Analyzing...', code);
};

const processNewAnalysis = async (filename) => {
  const lines = await analyze(filename);
  let originalPrecomputePath = '';
  lines.forEach((line) => {
    if (!originalPrecomputePath) {
      ([, originalPrecomputePath] = line.match(/^wrote (.+\.afpt)/) || []);
    }
  });
  const precomputeDir = getPrecomputePath();
  const precomputePath = join(precomputeDir, basename(originalPrecomputePath));
  if (!existsSync(precomputeDir)) {
    await mkdir(precomputeDir);
  }
  await rename(originalPrecomputePath, precomputePath);

  const jsonPath = precomputePath.replace(/\.afpt$/, '.json');
  await writeFile(jsonPath, JSON.stringify({ precompute: lines }));

  return precomputePath;
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

ipcMain.on('listPrecompute', () => {
  listFiles(getPrecomputePath(), '.afpt').then((files) => {
    sendToMainWindow('precomputeListed', { files });
  });
});

ipcMain.on('listDatabases', () => {
  listFiles(getDatabasePath(), '.pklz').then((files) => {
    sendToMainWindow('databasesListed', { files });
  });
});

ipcMain.on('listDatabase', async (event, { filename }) => {
  try {
    const contents = await readFile(filename.replace(/\.pklz$/, '.txt'), 'utf-8');
    sendToMainWindow('pythonOutput', { line: contents });
  } catch (listError) {
    sendToMainWindow('pythonOutput', { error: listError.toString() });
  }
});

ipcMain.on('listMatches', async (event, { filename }) => {
  let contents;
  try {
    contents = await readFile(filename.replace(/\.afpt$/, '.json'), 'utf-8');
  } catch (listError) {
    sendToMainWindow('matchesListed', { error: listError.toString() });
  }
  try {
    const analysis = JSON.parse(contents.toString());
    const { parsedMatchesByDatabase } = analysis || {};
    sendToMainWindow('matchesListed', { parsedMatchesByDatabase });
  } catch (parseError) {
    sendToMainWindow('matchesListed', { error: parseError.toString() });
  }
});

ipcMain.on('import', async (event, { object }) => {
  const manifests = {
    databases: {
      title: 'Select a directory with .pklz files',
      emptyMessage: 'No .pklz files found in the selected directory',
      path: getDatabasePath(),
      dataExt: '.pklz',
      callback: async (files) => {
        const precomputeFiles = await listFiles(getPrecomputePath(), '.afpt');
        const precomputePaths = precomputeFiles.map(({ fullname: precomputePath }) => precomputePath);
        files.reduce(
          (p, { fullname: filename }) => p.then(() => processNewDatabase(filename, precomputePaths)),
          Promise.resolve(),
        );
        listFiles(getDatabasePath(), '.pklz').then((mergedFiles) => {
          sendToMainWindow('databasesListed', { files: mergedFiles });
        });
      },
    },
    analyses: {
      title: 'Select a directory with .afpt files',
      emptyMessage: 'No .afpt files found in the selected directory',
      path: getPrecomputePath(),
      dataExt: '.afpt',
      callback: async (files) => {
        const precomputePaths = [];
        const dbFiles = await listFiles(getDatabasePath(), '.pklz');
        files.reduce(
          (p, { fullname: filename }) => p.then(async () => precomputePaths.push(await processNewAnalysis(filename))),
          Promise.resolve(),
        );
        dbFiles.reduce(
          (p, { fullname: dbPath, basename: dbName }) => p.then(() => match(dbName, dbPath, precomputePaths)),
          Promise.resolve(),
        );
        listFiles(getPrecomputePath(), '.afpt').then((mergedFiles) => {
          sendToMainWindow('precomputeListed', { files: mergedFiles });
        });
      },
    },
  };
  const manifest = manifests[object];
  const { filePaths, canceled } = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: manifest.title,
  }) || {};
  if (canceled) {
    return;
  }
  const newFiles = [];
  const [dir] = filePaths || [];
  const files = await listFiles(dir, manifest.dataExt);
  if (!files.length) {
    await dialog.showMessageBox({ message: manifest.emptyMessage });
  }
  await files.reduce(
    (p, { fullname: filename }) => p.then(() => {
      const dest = join(manifest.path, basename(filename));
      newFiles.push({ fullname: dest });
      copySync(filename, dest);
    }),
    Promise.resolve(),
  );
  await manifest.callback(newFiles);
});

ipcMain.on('export', async (event, { object, filename: requestedFilename }) => {
  const manifests = {
    databases: {
      title: 'Export databases',
      singularRemovalMessage: 'Remove the exported database from Fingerprinter?',
      pluralRemovalMessage: 'Remove the exported databases from Fingerprinter?',
      path: getDatabasePath(),
      dataExt: '.pklz',
      metadataExt: '.txt',
      callback: (files) => {
        sendToMainWindow('databasesListed', { files });
      },
    },
    analyses: {
      title: 'Export analyses',
      singularRemovalMessage: 'Remove the exported analysis from Fingerprinter?',
      pluralRemovalMessage: 'Remove the exported analyses from Fingerprinter?',
      path: getPrecomputePath(),
      dataExt: '.afpt',
      metadataExt: '.json',
      callback: (files) => {
        sendToMainWindow('precomputeListed', { files });
      },
    },
  };
  const manifest = manifests[object];
  const { filePaths, canceled } = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: requestedFilename ? `Export ${basename(requestedFilename, manifest.dataExt)}` : manifest.title,
  }) || {};
  const [dir] = filePaths || [];
  const files = await listFiles(manifest.path, manifest.dataExt);
  const filenames = [];
  files.forEach(({ fullname: filename }) => {
    if (requestedFilename && filename !== requestedFilename) {
      // if the user only requested export of a single object and not this object, do not stage this object for export
      return;
    }
    const metadataFilename = filename.replace(manifest.dataExt, manifest.metadataExt);
    filenames.push(filename);
    filenames.push(metadataFilename);
  });
  if (!canceled) {
    filenames.forEach((filename) => {
      try {
        copySync(filename, join(dir, basename(filename)));
      } catch (e) {
        // ignore copy error
      }
    });
    const { response } = await dialog.showMessageBox({
      message: files.length > 1 ? manifest.pluralRemovalMessage : manifest.singularRemovalMessage,
      buttons: ['Remove', 'Keep'],
    }) || {};
    if (response === 0) { // remove
      try {
        await Promise.all(filenames.map((filename) => rm(filename)));
      } catch (e) {
        // ignore remove error
      }
      listFiles(manifest.path, manifest.dataExt).then(manifest.callback);
    }
  }
});

ipcMain.on('openAudioFile', () => {
  dialog.showOpenDialog({
    properties: ['openFile'],
  }).then(async ({ filePaths }) => {
    const [filename] = filePaths || [];
    const precomputePath = await processNewAnalysis(filename);
    const dbFiles = await listFiles(getDatabasePath(), '.pklz');
    dbFiles.reduce(
      (p, { fullname: dbPath, basename: dbName }) => p.then(() => match(dbName, dbPath, [precomputePath])),
      Promise.resolve(),
    );
    listFiles(getPrecomputePath(), '.afpt').then((files) => {
      sendToMainWindow('precomputeListed', { files });
    });
  });
});

ipcMain.on('storeDatabase', async (event, options) => {
  const {
    root, cwd, filenames, cores,
  } = options || {};
  const { base: defaultPath } = parse(root) || {};
  const dbPath = join(getDatabasePath(), `${defaultPath}.pklz`);
  const precomputeFiles = await listFiles(getPrecomputePath(), '.afpt');
  const precomputePaths = precomputeFiles.map(({ fullname: precomputePath }) => precomputePath);
  let code;
  if (cwd) {
    code = getAudfprintScriptForDir(cwd, ['new', '-C', '-H', cores, '-d', dbPath, ...filenames]);
  } else {
    code = getAudfprintScript(['new', '-C', '-H', cores, '-d', dbPath, ...filenames]);
  }
  await sendPythonOutput('Fingerprinting...', code);
  await processNewDatabase(dbPath, precomputePaths);
  listFiles(getDatabasePath(), '.pklz').then((files) => {
    sendToMainWindow('databasesListed', { files });
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
