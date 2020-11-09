import { ApolloProvider } from '@apollo/client';
import React from 'react';
import './App.css';
import { useClient } from './client';
import { RoutineProcess } from './RoutineProcess';
import { AppNavigator } from './AppNavigator';
import { ThemeProvider } from '@material-ui/core';
import { theme } from './theme';
import { CookiesProvider } from "react-cookie";
import { BlockingBackdrop } from './BlockingBackdrop';

function App() {
  const client = useClient()

  return (
    <>
      {!client && (
        <div>App is loading...</div>
      )}
      {client && (
        <CookiesProvider>
          <ApolloProvider client={client}>
            <ThemeProvider theme={theme}>
              <AppNavigator />
              <BlockingBackdrop />
              <RoutineProcess />
            </ThemeProvider>
          </ApolloProvider>
        </CookiesProvider>
      )}
    </>
  );
}

export default App;
