import { ApolloProvider } from '@apollo/client';
import React, { useEffect, useState } from 'react';
import './App.css';
import { getClient } from './client';
import { PromiseReturnType } from './types';
import { RoutineProcess } from './RoutineProcess';
import { AppNavigator } from './AppNavigator';
import { ThemeProvider } from '@material-ui/core';
import { theme } from './theme';

function App() {
  const [client, setClient] = useState<PromiseReturnType<typeof getClient> | undefined>(undefined)

  useEffect(() => {
    (async () => {
      setClient(await getClient())
    })()
  }, [])

  return (
    <>
      {!client && (
        <div>App is loading...</div>
      )}
      {client && (
        <ApolloProvider client={client}>
          <ThemeProvider theme={theme}>
            <AppNavigator />
            <RoutineProcess />
          </ThemeProvider>
        </ApolloProvider>
      )}
    </>
  );
}

export default App;
