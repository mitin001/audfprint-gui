import React from 'react';
import { FaFileAudio } from 'react-icons/fa';
import { Box, Button } from '@mui/material';
import theme from '../../theme';
import ReviewAudioFiles from './ReviewAudioFiles';

export default function FingerprintPage() {
  return (
    <Box>
      <Button
        theme={theme}
        variant="contained"
        startIcon={<FaFileAudio size={25} />}
        onKeyPress={() => window.ipc.send('openAudioDirectory')}
        onClick={() => window.ipc.send('openAudioDirectory')}
      >
        Select directory with audio files
      </Button>
      <ReviewAudioFiles />
    </Box>
  );
}
