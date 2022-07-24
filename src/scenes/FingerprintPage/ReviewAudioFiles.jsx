import React, { useEffect, useState } from 'react';
import { RiSave3Fill } from 'react-icons/ri';
import { FaHighlighter } from 'react-icons/fa';
import { FiCpu } from 'react-icons/all';
import {
  Box, Button, Grid, Slider, TextField, Typography,
} from '@mui/material';
import theme from '../../theme';

export default function ReviewAudioFiles() {
  const [systemData, setSystemData] = useState({
    root: '', filenames: [], maxCores: 1, platform: '',
  });
  const [fileTypes, setFileTypes] = useState(localStorage.getItem('fileTypes') || '.mp3,.wav,.flac');
  const [cores, setCores] = useState(1);
  const [redaction, setRedaction] = useState('');

  const {
    root = '', filenames = [], maxCores = 1, platform = '',
  } = systemData || {};
  const matcher = platform === 'win32' ? /\\/g : /\//g;
  const maxPathDepth = (root.match(matcher) || []).length + 1;
  const trimmedFileTypes = fileTypes.split(',').map((fileType) => fileType.trim());
  const filteredFilenames = filenames.map((filename) => (
    filename.replace(redaction, '')
  )).filter((filename) => (
    trimmedFileTypes.some((fileType) => filename.toUpperCase().indexOf(fileType.toUpperCase()) !== -1)
  ));

  function valueLabelFormat(selectedCores) {
    return `${((100 * selectedCores) / maxCores).toFixed(0)}%`;
  }

  function pathLabelFormat(selectedPathDepth) {
    if (selectedPathDepth === maxPathDepth) {
      const slash = platform === 'win32' ? '\\' : '/';
      return `${root}${slash}`;
    }
    const pattern = platform === 'win32' ? `^([^\\\\]*\\\\){${selectedPathDepth}}` : `^([^/]*/){${selectedPathDepth}}`;
    const [match] = root.match(new RegExp(pattern)) || [];
    return match;
  }

  useEffect(() => {
    window.ipc.on('audioDirectoryOpened', (event, data) => {
      setSystemData(data);
    });
    return () => window.ipc.removeAllListeners('audioDirectoryOpened');
  }, []);

  if (!root) {
    return <div />;
  }

  return (
    <Box sx={{ mt: 3 }} theme={theme}>
      <Grid container spacing={0} alignItems="top">
        <TextField
          label="File types"
          value={fileTypes}
          helperText="Refine the list of files to fingerprint"
          onChange={({ target: { value } }) => {
            localStorage.setItem('fileTypes', value);
            setFileTypes(value);
          }}
        />
        <Grid item sx={{ ml: 2 }}>
          <Typography id="input-slider" gutterBottom>
            Max CPU usage
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <FiCpu />
            </Grid>
            <Grid item xs>
              <Slider
                theme={theme}
                aria-label="Max CPU usage"
                valueLabelFormat={valueLabelFormat}
                min={1}
                max={maxCores}
                defaultValue={1}
                step={1}
                valueLabelDisplay="auto"
                onChange={(event, value) => setCores(value)}
              />
            </Grid>
          </Grid>
        </Grid>
        <Grid item sx={{ ml: 2 }}>
          <Typography id="input-slider" gutterBottom>
            Path redaction
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <FaHighlighter />
            </Grid>
            <Grid item xs>
              <Slider
                theme={theme}
                aria-label="Path redaction"
                valueLabelFormat={(value) => pathLabelFormat(value) || 'No redaction'}
                min={0}
                max={maxPathDepth}
                defaultValue={0}
                step={1}
                valueLabelDisplay="auto"
                onChange={(event, value) => setRedaction(pathLabelFormat(value))}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <Box sx={{ mt: 1 }}>
        <Button
          theme={theme}
          variant="contained"
          startIcon={<RiSave3Fill size={25} />}
          onKeyPress={() => (
            window.ipc.send('storeDatabase', {
              root, cwd: redaction, filenames: filteredFilenames, cores,
            })
          )}
          onClick={() => (
            window.ipc.send('storeDatabase', {
              root, cwd: redaction, filenames: filteredFilenames, cores,
            })
          )}
        >
          Save fingerprint database
        </Button>
      </Box>
      <pre>
        {
          filteredFilenames.join('\n')
        }
      </pre>
      <span>{`${filteredFilenames.length} files total`}</span>
    </Box>
  );
}
