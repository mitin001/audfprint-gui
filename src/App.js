import React, { useEffect, useState } from 'react';
import { Typography } from '@mui/material';
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
    return <Typography variant="h4" component="h4" sx={{ m: 5 }}>Installation in progress...</Typography>;
  }

  return <AppContent />;
};

export default App;
