import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';

export default function ListDatabase(props) {
  const { filename } = props || {};
  const [newLine, setNewLine] = useState({});
  const [lines, setLines] = useState([]);

  useEffect(() => {
    window.ipc.send('listDatabase', { filename });
    window.ipc.on('pythonOutput', (event, line) => {
      setNewLine(line);
    });
    return () => window.ipc.removeAllListeners('pythonOutput');
  }, []);

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
            key={line}
          >
            {line}
          </pre>
        ))
      }
    </Box>
  );
}
