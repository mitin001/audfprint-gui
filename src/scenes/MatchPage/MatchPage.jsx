import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { Button } from '@mui/material';
import { IoMdAddCircle } from 'react-icons/io';
import { FaFileAudio } from 'react-icons/fa';
import ReactTooltip from 'react-tooltip';
import PythonOutput from '../FingerprintPage/PythonOutput';
import mainTheme from '../../theme';
import { DrawerHeader, AppBar, Drawer } from '../../drawer';

export default function AppContent() {
  const theme = mainTheme;
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" open={open} theme={theme}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={() => setOpen(true)}
            edge="start"
            sx={{
              marginRight: 5,
              ...(open && { display: 'none' }),
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            New Analysis
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" open={open}>
        <DrawerHeader>
          <IconButton onClick={() => setOpen(false)}>
            {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          <ListItemButton
            sx={{
              minHeight: 48,
              justifyContent: open ? 'initial' : 'center',
              px: 2.5,
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: open ? 3 : 'auto',
                justifyContent: 'center',
              }}
            >
              <IoMdAddCircle
                data-delay-show="500"
                data-tip="New"
                size={25}
              />
              <ReactTooltip />
            </ListItemIcon>
            <ListItemText primary="New" sx={{ opacity: open ? 1 : 0 }} />
          </ListItemButton>
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <DrawerHeader />
        <Box>
          <Button
            theme={theme}
            variant="contained"
            startIcon={<FaFileAudio size={25} />}
            onKeyPress={() => window.ipc.send('openAudioFile')}
            onClick={() => window.ipc.send('openAudioFile')}
          >
            Select audio file
          </Button>
          <PythonOutput />
        </Box>
      </Box>
    </Box>
  );
}
