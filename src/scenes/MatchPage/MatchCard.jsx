import React from 'react';
import {
  Card, CardContent, Typography,
} from '@mui/material';

function getHhmmss(s) {
  const iso = new Date(s.toFixed(2) * 1000).toISOString();
  const [, hh, mm, ss, ms] = iso.match(/T([0-9]{2}):([0-9]{2}):([0-9]{2})\.([0-9]{2})/) || [];
  if (hh === '00') {
    return `${mm}:${ss}.${ms}`;
  }
  return `${hh}:${mm}:${ss}.${ms}`;
}

export default function MatchCard(props) {
  const { database, match, name } = props || {};
  const {
    matchFilename, rank, commonHashNumerator, commonHashDenominator,
    matchStartInQuery, matchStartInFingerprint, matchDuration,
  } = match || {};
  const matchStartInQueryFloat = parseFloat(matchStartInQuery);
  const matchStartInFingerprintFloat = parseFloat(matchStartInFingerprint);
  const matchDurationFloat = parseFloat(matchDuration);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography component="div" variant="h6">
          <span>Database: </span>
          <strong>{database}</strong>
        </Typography>
        <pre>
          <span>{`┌ ${getHhmmss(matchStartInQueryFloat)} - ${getHhmmss(matchStartInQueryFloat + matchDurationFloat)} `}</span>
          <strong>{name}</strong>
          <br />
          <span>{`└ ${getHhmmss(matchStartInFingerprintFloat)} - ${getHhmmss(matchStartInFingerprintFloat + matchDurationFloat)} `}</span>
          <strong>{matchFilename}</strong>
        </pre>
        <Typography sx={{ mt: 1 }} color="text.secondary" variant="body2">
          <span>Match duration: </span>
          <strong>{`${matchDuration} s`}</strong>
          <br />
          <span>Common hashes: </span>
          <strong>{`${commonHashNumerator}/${commonHashDenominator}`}</strong>
          <br />
          <span>Rank: </span>
          <strong>{rank}</strong>
        </Typography>
      </CardContent>
    </Card>
  );
}
