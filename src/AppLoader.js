import React from 'react';
import App from './App';

async function init() {
  if (window.ipc && typeof window.ipc.send === 'function') {
    window.ipc.send('checkDependencies');
    window.ipc.send('checkForUpdates');
    window.ipc.on('log', (event, message) => {
      let log = [];
      try {
        log = JSON.parse(sessionStorage.getItem('log')) || [];
      } catch (e) {
        // ignore error - assume no log was cached
      }
      log.push(message);
      sessionStorage.setItem('log', JSON.stringify(log));
      window.ipc.send('logStored', log);
    });
  }
}

const AppLoader = () => {
  init();
  return <App />;
};

export default AppLoader;
