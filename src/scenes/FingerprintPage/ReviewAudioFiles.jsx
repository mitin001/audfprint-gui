import React, { useState } from 'react';

export default function ReviewAudioFiles() {
  const [filenames, setFilenames] = useState([]);
  const [fileTypes, setFileTypes] = useState('.mp3,.wav,.flac');
  window.ipc.on('audioDirectoryOpened', (event, { filePaths }) => {
    setFilenames(filePaths);
  });
  const trimmedFileTypes = fileTypes.split(',').map((fileType) => fileType.trim());
  const filteredFilenames = filenames.filter((filename) => (
    trimmedFileTypes.some((fileType) => filename.indexOf(fileType) !== -1)
  ));
  return (
    <div className="ui">
      <div className="ui labeled input">
        <div className="ui label">
          File types
        </div>
        <input
          type="text"
          placeholder=".mp3,.wav,.flac"
          value={fileTypes}
          onChange={({ target: { value } }) => setFileTypes(value)}
        />
      </div>
      <ol>
        {
          filteredFilenames.map((filename) => <li key={filename}>{filename}</li>)
        }
      </ol>
    </div>
  );
}
