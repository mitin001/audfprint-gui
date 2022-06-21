import React, { useState } from 'react';
import {
  Box, Button, FormControl, IconButton, InputLabel, MenuItem, Select,
} from '@mui/material';
import { CgExport } from 'react-icons/cg';
import { ImSortAmountAsc, ImSortAmountDesc } from 'react-icons/all';
import MatchCard from './MatchCard';
import theme from '../../theme';

export default function ListMatches(props) {
  const { filename, name, matchData } = props || {};
  const { error, parsedMatchesByDatabase } = matchData || {};
  const [orderBy, setOrderBy] = useState();
  const [desc, setDesc] = useState(false);
  const compare = (a, b) => {
    const left = parsedMatchesByDatabase[a] || {};
    const right = parsedMatchesByDatabase[b] || {};
    return (desc ? (-1) : 1) * (left[orderBy] - right[orderBy]);
  };

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
      <FormControl sx={{ mb: 2, ml: 2, minWidth: 200 }} size="small">
        <InputLabel id="order-by-label">Order by</InputLabel>
        <Select
          labelId="order-by-label"
          id="order-by"
          value={orderBy}
          label="Order by"
          onChange={({ target: { value } }) => setOrderBy(value)}
        >
          <MenuItem value="matchDuration">Match duration</MenuItem>
          <MenuItem value="matchStartInQuery">Match start in query</MenuItem>
          <MenuItem value="matchStartInFingerprint">Match start in fingerprint</MenuItem>
          <MenuItem value="rank">Rank</MenuItem>
          <MenuItem value="commonHashNumerator">Common hashes</MenuItem>
        </Select>
      </FormControl>
      <IconButton
        sx={{ mb: 2 }}
        aria-label="order-by-button"
        onKeyPress={() => setDesc(!desc)}
        onClick={() => setDesc(!desc)}
      >
        {desc ? <ImSortAmountDesc /> : <ImSortAmountAsc />}
      </IconButton>
      <pre>{error || ''}</pre>
      {
        Object.keys(parsedMatchesByDatabase).sort(compare).map((database) => (
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
