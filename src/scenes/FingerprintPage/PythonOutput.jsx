import React, { useState, useEffect, useRef } from 'react';
import { Box } from '@mui/material';

export default function PythonOutput(props) {
  const { timestamp } = props || {};
  const [newLine, setNewLine] = useState({});
  const [lines, setLines] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    window.ipc.on('pythonOutput', (event, line) => {
      setNewLine(line);
    });
    return () => window.ipc.removeAllListeners('pythonOutput');
  }, []);

  useEffect(() => {
    if (newLine) {
      setLines([...lines, newLine]);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      <div ref={bottomRef} style={{ width: 0 }} />
    </Box>
  );
}
