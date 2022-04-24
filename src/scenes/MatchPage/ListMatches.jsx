import React from 'react';
import { Box } from '@mui/material';
import MatchCard from './MatchCard';

export default function ListMatches(props) {
  const { name, matchData } = props || {};
  const { error, parsedMatchesByDatabase } = matchData || {};

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
