import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';

export default function PythonOutput() {
  const [newLine, setNewLine] = useState('');
  const [lines, setLines] = useState([]);

  useEffect(() => {
    window.ipc.on('pythonOutput', (event, line) => {
      setNewLine(line);
    });
  }, []);

  useEffect(() => {
    if (newLine) {
      setLines([...lines, newLine]);
    }
  }, [newLine]);

  return (
    <Box sx={{ mt: 2 }}>
      {
        lines.map((line) => <pre style={{ margin: 0 }} key={line}>{line}</pre>)
      }
    </Box>
  );
}
