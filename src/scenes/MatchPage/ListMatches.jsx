import React from 'react';
import { Box, Button } from '@mui/material';
import { CgExport } from 'react-icons/cg';
import MatchCard from './MatchCard';
import theme from '../../theme';

export default function ListMatches(props) {
  const { filename, name, matchData } = props || {};
  const { error, parsedMatchesByDatabase } = matchData || {};

  return (
    <Box>
      <Button
        sx={{ mb: 2 }}
        theme={theme}
        variant="contained"
        startIcon={<CgExport size={25} />}
        onKeyPress={() => window.ipc.send('export', { object: 'analyses', filename })}
        onClick={() => window.ipc.send('export', { object: 'analyses', filename })}
      >
        Export analysis
      </Button>
      <pre>{error || ''}</pre>
      {
        Object.keys(parsedMatchesByDatabase).map((database) => (
          <MatchCard
            key={database}
            name={name}
            database={database}
            match={parsedMatchesByDatabase[database]}
          />
        ))
      }
    </Box>
  );
}
