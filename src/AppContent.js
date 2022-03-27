import React, { useRef, useState } from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import { IoMdFingerPrint } from 'react-icons/io';
import { CgReorder } from 'react-icons/cg';
import FingerprintPage from './scenes/FingerprintPage/FingerprintPage';
import MatchPage from './scenes/MatchPage/MatchPage';

export default function FixedBottomNavigation() {
  const ref = useRef(null);
  const [index, setIndex] = useState(0);
  const pages = [
    <FingerprintPage />,
    <MatchPage />,
  ];
  return (
    <Box sx={{ pb: 7 }} ref={ref}>
      <CssBaseline />
      {pages[index]}
      <Paper
        sx={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
        }}
        elevation={3}
      >
        <BottomNavigation
          showLabels
          value={index}
          onChange={(event, newIndex) => {
            setIndex(newIndex);
          }}
        >
          <BottomNavigationAction label="Fingerprint" icon={<IoMdFingerPrint size={25} />} />
          <BottomNavigationAction label="Match" icon={<CgReorder size={25} />} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
