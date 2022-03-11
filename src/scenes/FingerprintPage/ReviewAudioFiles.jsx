import React, { useEffect, useState } from 'react';
import { RiSave3Fill } from 'react-icons/ri';
import ReactTooltip from 'react-tooltip';
import PythonOutput from './PythonOutput';

const slash = '/';

export default function ReviewAudioFiles() {
  const [systemData, setSystemData] = useState({ root: '', filenames: [], maxCores: 1 });
  const [fileTypes, setFileTypes] = useState('.mp3,.wav,.flac');
  const [levels, setLevels] = useState(0);
  const [cores, setCores] = useState(1);

  const { root = '', filenames = [], maxCores = 1 } = systemData || {};
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
  const maxLevels = root.split(slash).length;

  useEffect(() => {
    window.ipc.on('audioDirectoryOpened', (event, data) => {
      setSystemData(data);
    });
  }, []);

  if (!root) {
    return <div />;
  }

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
      <div className="ui labeled input">
        <div className="ui label">
          Cores
        </div>
        <input
          type="number"
          min={1}
          max={maxCores}
          value={cores}
          onChange={({ target: { value } }) => setCores(value)}
        />
      </div>
      <span
        className="layout-link"
        role="button"
        tabIndex={0}
        onKeyPress={() => window.ipc.send('storeDatabase', { root, filenames: filteredFilenames, cores })}
        onClick={() => window.ipc.send('storeDatabase', { root, filenames: filteredFilenames, cores })}
      >
        <RiSave3Fill
          data-delay-show="500"
          data-tip="Fingerprint the selected audio files and store the database with them"
          size={25}
        />
        <ReactTooltip />
        <span>Start</span>
      </span>
      <PythonOutput />
      <ol>
        {
          filteredFilenames.map((filename) => <li key={filename}>{filename}</li>)
        }
      </ol>
    </div>
  );
}
