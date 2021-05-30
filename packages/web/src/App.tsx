import { FC, Suspense, useEffect, useState } from 'react';
import { RoutineProcess } from './RoutineProcess';
import { AppNavigator } from './navigation/AppNavigator';
import { ThemeProvider } from '@material-ui/core';
import { theme } from './theme';
import { BlockingBackdrop } from './common/BlockingBackdrop';
import { UnlockLibraryDialog } from './auth/UnlockLibraryDialog';
import { TourProvider } from './app-tour/TourProvider';
import { ManageBookCollectionsDialog } from './books/ManageBookCollectionsDialog';
import { GoogleApiProvider } from './dataSources/google/helpers';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { UpdateAvailableDialog } from './UpdateAvailableDialog';
import { RxDbProvider } from './rxdb';
import { useObservers } from './sync/useObservers';
import { useLoadInitialState } from './useLoadInitialState';
import { AxiosProvider } from './axiosClient';
import { PersistedRecoilRoot } from './PersistedRecoilRoot';
import { libraryState } from './library/states';
import { normalizedBookDownloadsState } from './download/states';
import { AppLoading } from './AppLoading';
import { FirstTimeExperienceTours } from './firstTimeExperience/FirstTimeExperienceTours';
import { firstTimeExperienceState } from './firstTimeExperience/firstTimeExperienceStates';
import { localSettingsState, localSettingsStateMigration } from './settings/states';
import { DialogProvider } from './dialog';
import { BlurContainer } from './books/BlurContainer';
import { authState } from './auth/authState';
import './i18n'
import { ErrorBoundary } from '@sentry/react';
import { ManageBookTagsDialog } from './books/ManageBookTagsDialog';
import { ManageTagBooksDialog } from './tags/ManageTagBooksDialog';
import { useRef } from 'react';

const localStatesToPersist = [
  libraryState,
  normalizedBookDownloadsState,
  firstTimeExperienceState,
  localSettingsState,
  authState,
]

const localStateMigration = (state: { [key: string]: { value: any } }) => {
  return localSettingsStateMigration(state)
}

export function App() {
  const [loading, setLoading] = useState(true)
  const [newServiceWorker, setNewServiceWorker] = useState<ServiceWorker | undefined>(undefined)

  return (
    <ErrorBoundary onError={e => { console.error(e) }}>
      <ThemeProvider theme={theme}>
        <Suspense fallback={<AppLoading />}>
          {loading && <AppLoading />}
          <RxDbProvider>
            <PersistedRecoilRoot
              states={localStatesToPersist}
              migration={localStateMigration}
              onReady={() => setLoading(false)}
            >
              <GoogleApiProvider>
                <AxiosProvider >
                  <DialogProvider>
                    <TourProvider>
                      <AppNavigator />
                      <FirstTimeExperienceTours />
                      <UnlockLibraryDialog />
                      <ManageBookCollectionsDialog />
                      <ManageBookTagsDialog />
                      <ManageTagBooksDialog />
                      <RoutineProcess />
                    </TourProvider>
                    <UpdateAvailableDialog serviceWorker={newServiceWorker} />
                    <RecoilSyncedWithDatabase />
                    <BlockingBackdrop />
                  </DialogProvider>
                </AxiosProvider>
              </GoogleApiProvider>
            </PersistedRecoilRoot>
          </RxDbProvider>
        </Suspense>
      </ThemeProvider>
      <ServiceWorkerRegistration onUpdateAvailable={sw => setNewServiceWorker(sw)} />
      <BlurContainer />
    </ErrorBoundary>
  );
}

const RecoilSyncedWithDatabase: FC = ({ children }) => {
  useLoadInitialState()
  useObservers()

  return null
}

const ServiceWorkerRegistration: FC<{ onUpdateAvailable: (sw: ServiceWorker) => void }> = ({ onUpdateAvailable }) => {
  const firstTime = useRef(true)

  useEffect(() => {
    if (firstTime.current) {
      firstTime.current = false
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
    }
  }, [onUpdateAvailable])

  return null
}