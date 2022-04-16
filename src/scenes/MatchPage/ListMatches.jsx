import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';

export default function ListMatches(props) {
  const { filename } = props || {};
  const [matchData, setMatchData] = useState({ parsedMatchesByDatabase: [] });
  const { error, parsedMatchesByDatabase } = matchData || {};

  useEffect(() => {
    window.ipc.send('listMatches', { filename });
    window.ipc.once('matchesListed', (event, data) => {
      console.log(data);
      const { error: incomingError, parsedMatchesByDatabase: incomingParsedMatchesByDatabase = [] } = data || {};
      setMatchData({ error: incomingError, parsedMatchesByDatabase: incomingParsedMatchesByDatabase });
    });
  }, []);

  return (
    <Box sx={{ mt: 2 }}>
      <pre>{error || ''}</pre>
      <table>
        <thead style={{ textAlign: 'center' }}>
          <th>Database</th>
          <th>Match duration</th>
          <th>Starts in query</th>
          <th>Starts in fingerprint</th>
          <th>Rank</th>
          <th>Common hashes</th>
        </thead>
        <tbody style={{ textAlign: 'center' }}>
          {
            Object.keys(parsedMatchesByDatabase).map((database) => (
              <tr key={database}>
                <td>{database}</td>
                <td>{parsedMatchesByDatabase[database].matchDuration}</td>
                <td>{parsedMatchesByDatabase[database].matchStartInQuery}</td>
                <td>{parsedMatchesByDatabase[database].matchStartInFingerprint}</td>
                <td>{parsedMatchesByDatabase[database].rank}</td>
                <td>{`${parsedMatchesByDatabase[database].commonHashNumerator}/${parsedMatchesByDatabase[database].commonHashDenominator}`}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </Box>
  );
}
