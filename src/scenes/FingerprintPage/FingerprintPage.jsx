import React from 'react';
import { FaFileAudio } from 'react-icons/fa';
import ReactTooltip from 'react-tooltip';
import ReviewAudioFiles from './ReviewAudioFiles';

export default function FingerprintPage() {
  return (
    <div className="ui container">
      <h1 className="ui header">Fingerprint</h1>
      <span
        className="layout-link"
        role="button"
        tabIndex={0}
        onKeyPress={() => window.ipc.send('openAudioDirectory')}
        onClick={() => window.ipc.send('openAudioDirectory')}
      >
        <FaFileAudio
          data-delay-show="500"
          data-tip="Select directory with the audio files to fingerprint"
          size={25}
        />
        <ReactTooltip />
        <span>Select directory with audio files</span>
      </span>
      <ReviewAudioFiles />
    </div>
  );
}
