import React, { FC, useEffect, useState } from 'react';
import { RoutineProcess } from './RoutineProcess';
import { AppNavigator } from './navigation/AppNavigator';
import { ThemeProvider } from '@material-ui/core';
import { theme } from './theme';
import { CookiesProvider } from "react-cookie";
import { BlockingBackdrop } from './common/BlockingBackdrop';
import { UnlockLibraryDialog } from './auth/UnlockLibraryDialog';
import { AppTourWelcome } from './firstTimeExperience/AppTourWelcome';
import { TourProvider } from './app-tour/TourProvider';
import { ManageBookCollectionsDialog } from './books/ManageBookCollectionsDialog';
import { GoogleApiProvider } from './dataSources/google/helpers';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { UpdateAvailableDialog } from './UpdateAvailableDialog';
import { RxDbProvider } from './rxdb';
import { useObservers } from './useObservers';
import { useLoadInitialState } from './useLoadInitialState';
import { AxiosProvider } from './axiosClient';
import { PersistedRecoilRoot } from './PersistedRecoilRoot';
import { libraryState } from './library/states';
import { normalizedBookDownloadsState } from './download/states';
import { AppLoading } from './AppLoading';
import { UserFeedback } from './UserFeedback';
import { AppTourFirstAddingBook } from './firstTimeExperience/AppTourFirstAddingBook';
import { firstTimeExperienceState } from './firstTimeExperience/firstTimeExperienceStates';
import { localSettingsState } from './settings/states';

const localStatesToPersist = [
  libraryState,
  normalizedBookDownloadsState,
  firstTimeExperienceState,
  localSettingsState,
]

export function App() {
  const [loading, setLoading] = useState(true)
  const [newServiceWorker, setNewServiceWorker] = useState<ServiceWorker | undefined>(undefined)

  return (
    <>
      <ThemeProvider theme={theme}>
        {loading && <AppLoading />}
        <RxDbProvider>
          <PersistedRecoilRoot states={localStatesToPersist} onReady={() => setLoading(false)}>
            <CookiesProvider>
              <GoogleApiProvider>
                <AxiosProvider >
                  <TourProvider>
                    <AppNavigator />
                    <AppTourWelcome />
                    <AppTourFirstAddingBook />
                    <UnlockLibraryDialog />
                    <ManageBookCollectionsDialog />
                    <RoutineProcess />
                  </TourProvider>
                  <UpdateAvailableDialog serviceWorker={newServiceWorker} />
                  <RecoilSyncedWithDatabase />
                  <BlockingBackdrop />
                </AxiosProvider>
              </GoogleApiProvider>
            </CookiesProvider>
            {/* <UserFeedback /> */}
          </PersistedRecoilRoot>
        </RxDbProvider>
      </ThemeProvider>
      <ServiceWorkerRegistrator onUpdateAvailable={sw => setNewServiceWorker(sw)} />
    </>
  );
}

const RecoilSyncedWithDatabase: FC = ({ children }) => {
  useLoadInitialState()
  useObservers()

  return null
}

const ServiceWorkerRegistrator: FC<{ onUpdateAvailable: (sw: ServiceWorker) => void }> = ({ onUpdateAvailable }) => {
  useEffect(() => {
    // If you want your app to work offline and load faster, you can change
    // unregister() to register() below. Note this comes with some pitfalls.
    // Learn more about service workers: https://cra.link/PWA
    serviceWorkerRegistration.register({
      onSuccess: () => console.warn('onSuccess'),
      onUpdate: reg => reg.waiting && onUpdateAvailable(reg.waiting),
      onWaitingServiceWorkerFound: async (reg) => {
        reg.waiting && onUpdateAvailable(reg.waiting)
      },
    });
  }, [onUpdateAvailable])

  return null
}