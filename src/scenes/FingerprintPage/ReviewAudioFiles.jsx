import React, { useState } from 'react';

const slash = '/';

export default function ReviewAudioFiles() {
  const [filenames, setFilenames] = useState([]);
  const [fileTypes, setFileTypes] = useState('.mp3,.wav,.flac');
  const [levels, setLevels] = useState(0);

  const [firstFilename = ''] = filenames;
  const trimmedFileTypes = fileTypes.split(',').map((fileType) => fileType.trim());
  const filteredFilenames = filenames.filter((filename) => (
    trimmedFileTypes.some((fileType) => filename.indexOf(fileType) !== -1)
  )).map((filename) => {
    const parts = filename.split(slash);
    const { length } = parts;
    if (length <= levels) {
      return filename;
    }
    return parts.slice(levels, length).join(slash);
  });
  const maxLevels = firstFilename.split(slash).length - 1;

  window.ipc.on('audioDirectoryOpened', (event, { filePaths }) => {
    setFilenames(filePaths);
  });

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
      <div className="ui labeled input">
        <div className="ui label">
          Levels
        </div>
        <input
          type="number"
          min={0}
          max={maxLevels}
          value={levels}
          onChange={({ target: { value } }) => setLevels(value)}
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
