import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import MatchCard from './MatchCard';

export default function ListMatches(props) {
  const { filename, name } = props || {};
  const [matchData, setMatchData] = useState({ parsedMatchesByDatabase: [] });
  const { error, parsedMatchesByDatabase } = matchData || {};

  useEffect(() => {
    window.ipc.send('listMatches', { filename });
    window.ipc.once('matchesListed', (event, data) => {
      const { error: incomingError, parsedMatchesByDatabase: incomingParsedMatchesByDatabase = [] } = data || {};
      setMatchData({ error: incomingError, parsedMatchesByDatabase: incomingParsedMatchesByDatabase });
    });
  }, []);

  return (
    <Box>
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
