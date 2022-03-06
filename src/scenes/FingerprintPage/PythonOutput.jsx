import React, { useState } from 'react';

export default function PythonOutput() {
  const [lines, setLines] = useState([]);

  window.ipc.on('pythonOutput', (event, line) => {
    setLines([...lines, line]);
  });

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
