import React, { useEffect, useState } from 'react';
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
import { UpdateAvailableDialog, updateAvailableState } from './UpdateAvailableDialog';
import { useDatabase } from './rxdb';
import { useObservers } from './useObservers';
import { useLoadInitialState } from './useLoadInitialState';
import { useRecoilState } from 'recoil';
import { AxiosProvider } from './axiosClient';

export function App() {
  const isInitialStateReady = useLoadInitialState()
  const db = useDatabase()
  const [, setUpdateAvailable] = useRecoilState(updateAvailableState)
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
        setUpdateAvailable(true)
      },
    });
  }, [setUpdateAvailable])

  return (
    <CookiesProvider>
      <GoogleApiProvider>
        <AxiosProvider >
          <ThemeProvider theme={theme}>
            {(!isInitialStateReady)
              ? null
              : (
                <>
                  <TourProvider>
                    <AppNavigator />
                    <AppTourWelcome />
                    <UnlockLibraryDialog />
                    <ManageBookCollectionsDialog />
                    <RoutineProcess />
                  </TourProvider>
                  <UpdateAvailableDialog serviceWorker={newServiceWorker} />
                </>
              )}
            <BlockingBackdrop />
          </ThemeProvider>
        </AxiosProvider>
      </GoogleApiProvider>
    </CookiesProvider>
  );
}
