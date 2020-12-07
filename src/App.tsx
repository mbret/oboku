import { ApolloProvider } from '@apollo/client';
import React, { useEffect, useState } from 'react';
import { getClient, useClient } from './client';
import { RoutineProcess } from './RoutineProcess';
import { AppNavigator } from './AppNavigator';
import { ThemeProvider } from '@material-ui/core';
import { theme } from './theme';
import { CookiesProvider } from "react-cookie";
import { BlockingBackdrop } from './BlockingBackdrop';
import { UnlockLibraryDialog } from './auth/UnlockLibraryDialog';
import { AppTourWelcome } from './firstTimeExperience/AppTourWelcome';
import { TourProvider } from './app-tour/TourProvider';
import { ManageBookCollectionsDialog } from './books/ManageBookCollectionsDialog';
import { GoogleApiProvider } from './google';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { UpdateAvailableDialog } from './UpdateAvailableDialog';
import { useDatabase } from './databases';
import { useObservers } from './useObservers';
import { useLoadInitialState } from './useLoadInitialState';

export function App() {
  const isInitialStateReady = useLoadInitialState()
  const client = useClient()
  const db = useDatabase()
  const [newServiceWorker, setNewServiceWorker] = useState<ServiceWorker | undefined>(undefined)

  useObservers()

  useEffect(() => {
    // If you want your app to work offline and load faster, you can change
    // unregister() to register() below. Note this comes with some pitfalls.
    // Learn more about service workers: https://cra.link/PWA
    serviceWorkerRegistration.register({
      onSuccess: () => console.warn('onSuccess'),
      onUpdate: reg => console.warn('onUpdate', reg),
      onWaitingServiceWorkerFound: async (reg) => {
        reg.waiting && setNewServiceWorker(reg.waiting)
        const client = await getClient()
        console.warn('onWaitingServiceWorkerFound', reg)
        try {
          client.modify('App', {
            id: client.identify({ __typename: 'App', id: '_' }),
            fields: {
              hasUpdateAvailable: _ => true
            }
          })
        } catch (e) {
          console.error(e)
        }
      },
    });
  }, [])

  return (
    <CookiesProvider>
      <GoogleApiProvider>
        <ThemeProvider theme={theme}>
          {(!isInitialStateReady || !client)
            ? null
            : (
              <ApolloProvider client={client}>
                <TourProvider>
                  <AppNavigator />
                  <AppTourWelcome />
                  <UnlockLibraryDialog />
                  <ManageBookCollectionsDialog />
                  <RoutineProcess />
                </TourProvider>
                <UpdateAvailableDialog serviceWorker={newServiceWorker} />
              </ApolloProvider>
            )}
          <BlockingBackdrop />
        </ThemeProvider>
      </GoogleApiProvider>
    </CookiesProvider>
  );
}
