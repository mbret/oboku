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
import { UnlockLibraryDialog } from './auth/UnlockLibraryDialog';
import { AppTourWelcome } from './firstTimeExperience/AppTourWelcome';
import { TourProvider } from './app-tour/TourProvider';
import { ManageBookSeriesDialog } from './books/ManageBookSeriesDialog';

function App() {
  const client = useClient()

  return (
    <>
      {!client && (
        null
      )}
      {client && (
        <CookiesProvider>
          <ApolloProvider client={client}>
            <ThemeProvider theme={theme}>
              <TourProvider>
                <AppNavigator />
                <AppTourWelcome />
                <UnlockLibraryDialog />
                <ManageBookSeriesDialog />
                <BlockingBackdrop />
                <RoutineProcess />
              </TourProvider>
            </ThemeProvider>
          </ApolloProvider>
        </CookiesProvider>
      )}
    </>
  );
}

export default App;
