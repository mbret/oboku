import { ThemeProvider } from '@material-ui/core';
import React from 'react'
import { theme } from './theme';
import { Home } from './Home';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Home />
    </ThemeProvider>

  );
}

export default App;
