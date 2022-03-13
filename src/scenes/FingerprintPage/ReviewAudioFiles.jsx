import React, { useEffect, useState } from 'react';
import { RiSave3Fill } from 'react-icons/ri';
import { Box, Button, TextField } from '@mui/material';
import PythonOutput from './PythonOutput';

export default function ReviewAudioFiles() {
  const [systemData, setSystemData] = useState({ root: '', filenames: [], maxCores: 1 });
  const [fileTypes, setFileTypes] = useState('.mp3,.wav,.flac');

  const { root = '', filenames = [] } = systemData || {};
  const trimmedFileTypes = fileTypes.split(',').map((fileType) => fileType.trim());
  const filteredFilenames = filenames.filter((filename) => (
    trimmedFileTypes.some((fileType) => filename.indexOf(fileType) !== -1)
  ));

  useEffect(() => {
    window.ipc.on('audioDirectoryOpened', (event, data) => {
      setSystemData(data);
    });
  }, []);

  if (!root) {
    return <div />;
  }

  return (
    <Box sx={{ mt: 3 }}>
      <TextField
        label="File types"
        defaultValue=".mp3,.wav,.flac"
        value={fileTypes}
        helperText="Refine the list of files to fingerprint"
        onChange={({ target: { value } }) => setFileTypes(value)}
      />
      <Box sx={{ mt: 1 }}>
        <Button
          variant="contained"
          startIcon={<RiSave3Fill size={25} />}
          onKeyPress={() => window.ipc.send('storeDatabase', { root, filenames: filteredFilenames })}
          onClick={() => window.ipc.send('storeDatabase', { root, filenames: filteredFilenames })}
        >
          Start
        </Button>
      </Box>
      <PythonOutput />
      <ol>
        {
          filteredFilenames.map((filename) => <li key={filename}>{filename}</li>)
        }
      </ol>
    </Box>
  );
}
