import React, { useEffect, useState } from 'react';
import AppContent from './AppContent';

const App = () => {
  const [installationStatus, setInstallationStatus] = useState({ installing: false });
  const { installing } = installationStatus || {};

  useEffect(() => {
    window.ipc.on('installationStatusChanged', (event, data) => {
      setInstallationStatus(data);
    });
  }, []);

  if (installing) {
    return <div className="install"><h1>Installation in progress...</h1></div>;
  }

  return <AppContent />;
};

export default App;
