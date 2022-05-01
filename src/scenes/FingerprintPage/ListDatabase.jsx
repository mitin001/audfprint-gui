import React, { useState, useEffect } from 'react';
import { Box, Button } from '@mui/material';
import { CgExport } from 'react-icons/cg';
import theme from '../../theme';

export default function ListDatabase(props) {
  const { filename, timestamp } = props || {};
  const [newLine, setNewLine] = useState({});
  const [lines, setLines] = useState([]);

  useEffect(() => {
    window.ipc.on('pythonOutput', (event, line) => {
      setNewLine(line);
    });
    return () => window.ipc.removeAllListeners('pythonOutput');
  }, []);

  // if the timestamp changes (the component is reloaded), clear out the old lines
  useEffect(() => {
    setLines([]);
  }, [timestamp]);

  useEffect(() => {
    if (newLine) {
      setLines([...lines, newLine]);
    }
  }, [newLine]);

  return (
    <Box>
      <Button
        sx={{ mb: 2 }}
        theme={theme}
        variant="contained"
        startIcon={<CgExport size={25} />}
        onKeyPress={() => window.ipc.send('exportDatabase', { filename })}
        onClick={() => window.ipc.send('exportDatabase', { filename })}
      >
        Export database
      </Button>
      {
        lines.map(({ line, error }) => (
          <pre
            style={{ margin: 0, color: error ? 'red' : 'black', fontWeight: error ? 'bold' : 'normal' }}
            key={timestamp + line}
          >
            {line}
          </pre>
        ))
      }
    </Box>
  );
}
