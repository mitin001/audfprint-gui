import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';

export default function ListDatabase(props) {
  const { timestamp } = props || {};
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
    <Box sx={{ mt: 2 }}>
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
