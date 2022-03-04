import React, { useState } from 'react';

export default function ReviewAudioFiles() {
  const [filenames, setFilenames] = useState([]);
  window.ipc.on('audioDirectoryOpened', (event, { filePaths }) => {
    setFilenames(filePaths);
  });
  return (
    <div className="ui container">
      <ol>
        {
          filenames.map((filename) => <li key={filename}>{filename}</li>)
        }
      </ol>
    </div>
  );
}
