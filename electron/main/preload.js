const { contextBridge, ipcRenderer } = require('electron');
const os = require('os');

contextBridge.exposeInMainWorld('ipc', {
  send: (channel, ...data) => {
    ipcRenderer.send(channel, ...data);
  },
  on: (channel, func) => {
    ipcRenderer.on(channel, func);
  },
  once: (channel, func) => {
    ipcRenderer.once(channel, func);
  },
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
});

if (typeof os.userInfo === 'function') {
  const { username } = os.userInfo() || {};
  contextBridge.exposeInMainWorld('userInfo', { username });
}
