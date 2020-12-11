import React, { FC, useEffect, useState } from 'react';
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
import { useSetRecoilState } from 'recoil';
import { AxiosProvider } from './axiosClient';
import { PersistedRecoilRoot } from './PersistedRecoilRoot';
import { libraryState } from './library/states';
import { normalizedBookDownloadsState } from './download/states';

const localStatesToPersist = [
  libraryState,
  normalizedBookDownloadsState,
]

export function App() {
  const [newServiceWorker, setNewServiceWorker] = useState<ServiceWorker | undefined>(undefined)

  return (
    <>
      <PersistedRecoilRoot states={localStatesToPersist}>
        <CookiesProvider>
          <GoogleApiProvider>
            <AxiosProvider >
              <ThemeProvider theme={theme}>
                <RecoilSyncedWithDatabase>
                  <TourProvider>
                    <AppNavigator />
                    <AppTourWelcome />
                    <UnlockLibraryDialog />
                    <ManageBookCollectionsDialog />
                    <RoutineProcess />
                  </TourProvider>
                  <UpdateAvailableDialog serviceWorker={newServiceWorker} />
                </RecoilSyncedWithDatabase>
                <BlockingBackdrop />
              </ThemeProvider>
            </AxiosProvider>
          </GoogleApiProvider>
        </CookiesProvider>
      </PersistedRecoilRoot>
      <UpdateAvailableObserver onUpdateAvailable={sw => setNewServiceWorker(sw)} />
    </>
  );
}

const RecoilSyncedWithDatabase: FC = ({ children }) => {
  useDatabase()
  const isInitialStateReady = useLoadInitialState()

  useObservers()

  return (
    <>
      {!isInitialStateReady ? null : children}
    </>
  )
}

const UpdateAvailableObserver: FC<{ onUpdateAvailable: (sw: ServiceWorker) => void }> = ({ onUpdateAvailable }) => {
  const setUpdateAvailable = useSetRecoilState(updateAvailableState)

  useEffect(() => {
    // If you want your app to work offline and load faster, you can change
    // unregister() to register() below. Note this comes with some pitfalls.
    // Learn more about service workers: https://cra.link/PWA
    serviceWorkerRegistration.register({
      onSuccess: () => console.warn('onSuccess'),
      onUpdate: reg => console.warn('onUpdate', reg),
      onWaitingServiceWorkerFound: async (reg) => {
        reg.waiting && onUpdateAvailable(reg.waiting)
        // reg.waiting && setNewServiceWorker(reg.waiting)
        setUpdateAvailable(true)
      },
    });
  }, [onUpdateAvailable, setUpdateAvailable])

  return null
}