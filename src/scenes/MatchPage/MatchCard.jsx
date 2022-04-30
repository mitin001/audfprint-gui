import React from 'react';
import {
  Divider, Card, CardContent, Typography,
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
    <Card sx={{ m: 1 }}>
      <CardContent>
        <pre>
          {`${getHhmmss(matchStartInQueryFloat)} - ${getHhmmss(matchStartInQueryFloat + matchDurationFloat)} ${name}\n`}
          {'         ≈\n'}
          {`${getHhmmss(matchStartInFingerprintFloat)} - ${getHhmmss(matchStartInFingerprintFloat + matchDurationFloat)} ${matchFilename}`}
        </pre>
        <Divider />
        <Typography sx={{ mt: 1 }} color="text.secondary" variant="body2">
          {`Match duration: ${matchDuration} s`}
          <br />
          {`Common hashes: ${commonHashNumerator}/${commonHashDenominator}`}
          <br />
          {`Database: ${database}`}
          <br />
          {`Rank: ${rank}`}
        </Typography>
      </CardContent>
    </Card>
  );
}
