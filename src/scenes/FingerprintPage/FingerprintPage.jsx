import React from 'react';
import { FaFileAudio } from 'react-icons/fa';
import { Button } from '@mui/material';
import ReviewAudioFiles from './ReviewAudioFiles';

export default function FingerprintPage() {
  return (
    <div>
      <Button
        variant="contained"
        startIcon={<FaFileAudio size={25} />}
        onKeyPress={() => window.ipc.send('openAudioDirectory')}
        onClick={() => window.ipc.send('openAudioDirectory')}
      >
        Select directory with audio files
      </Button>
      <ReviewAudioFiles />
    </div>
  );
}
