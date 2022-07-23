import React, { useState, useEffect } from 'react';
import {
  Box, Button, FormControl, IconButton, InputLabel,
  MenuItem, Select,
} from '@mui/material';
import { CgExport } from 'react-icons/cg';
import { VscCombine } from 'react-icons/vsc';
import theme from '../../theme';

export default function ListDatabase(props) {
  const { filename, databaseList = [], timestamp } = props || {};
  const [newLine, setNewLine] = useState({});
  const [lines, setLines] = useState([]);
  const [incomingDbs, setIncomingDbs] = useState([]);

  useEffect(() => {
    window.ipc.on('pythonOutput', (event, line) => {
      setNewLine(line);
    });
    return () => window.ipc.removeAllListeners('pythonOutput');
  }, []);

  // if the timestamp changes (the component is reloaded), clear out the old lines
  useEffect(() => {
    setLines([]);
  }, [timestamp]);

  useEffect(() => {
    if (newLine) {
      setLines([...lines, newLine]);
    }
  }, [newLine]);

  return (
    <Box>
      <Button
        sx={{ mb: 2 }}
        theme={theme}
        variant="contained"
        startIcon={<CgExport size={25} />}
        onKeyPress={() => window.ipc.send('export', { object: 'databases', filename })}
        onClick={() => window.ipc.send('export', { object: 'databases', filename })}
      >
        Export database
      </Button>
      <FormControl
        sx={{
          mb: 2, ml: 2, minWidth: 300, maxWidth: 300,
        }}
        size="small"
      >
        <InputLabel id="merge-with-label">Merge with...</InputLabel>
        <Select
          multiple
          labelId="merge-with-label"
          id="merge-with"
          value={incomingDbs}
          label="Merge with..."
          onChange={({ target: { value } }) => setIncomingDbs(value)}
        >
          {
            databaseList.map(({ fullname, basename }) => (
              fullname === filename
                ? null
                : <MenuItem value={fullname} key={basename}>{basename}</MenuItem>
            ))
          }
        </Select>
      </FormControl>
      <IconButton
        sx={{ mb: 2 }}
        aria-label="order-by-button"
        onKeyPress={() => window.ipc.send('merge', { incomingDbs, filename })}
        onClick={() => window.ipc.send('merge', { incomingDbs, filename })}
      >
        <VscCombine />
      </IconButton>
      {
        lines.map(({ line, error }) => (
          <pre
            style={{ margin: 0, color: error ? 'red' : 'black', fontWeight: error ? 'bold' : 'normal' }}
            key={timestamp + line}
          >
            {line}
          </pre>
        ))
      }
    </Box>
  );
}
