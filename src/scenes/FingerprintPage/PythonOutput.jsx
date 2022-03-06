import React, { useState, useEffect } from 'react';

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
    <div className="ui">
      <ol>
        {
          lines.map((line) => <li key={line}>{line}</li>)
        }
      </ol>
    </div>
  );
}
