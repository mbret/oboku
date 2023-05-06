import { FC, Suspense, useEffect, useState } from "react"
import { AppNavigator } from "./navigation/AppNavigator"
import { ThemeProvider, Theme, StyledEngineProvider } from "@mui/material"
import { theme } from "./theme"
import { BlockingBackdrop } from "./common/BlockingBackdrop"
import { TourProvider } from "./app-tour/TourProvider"
import { ManageBookCollectionsDialog } from "./books/ManageBookCollectionsDialog"
import { plugins } from "./plugins/configure"
import * as serviceWorkerRegistration from "./serviceWorkerRegistration"
import { UpdateAvailableDialog } from "./UpdateAvailableDialog"
import { RxDbProvider } from "./rxdb"
import { useObservers } from "./rxdb/sync/useObservers"
import { PreloadQueries } from "./PreloadQueries"
import { AxiosProvider } from "./axiosClient"
import { normalizedBookDownloadsStatePersist } from "./download/states"
import { AppLoading } from "./AppLoading"
import { FirstTimeExperienceTours } from "./firstTimeExperience/FirstTimeExperienceTours"
import { firstTimeExperienceStatePersist } from "./firstTimeExperience/firstTimeExperienceStates"
import { localSettingsStatePersist } from "./settings/states"
import { DialogProvider } from "./dialog"
import { BlurContainer } from "./books/BlurContainer"
import { authStatePersist } from "./auth/authState"
import "./i18n"
import { ErrorBoundary } from "@sentry/react"
import { ManageBookTagsDialog } from "./books/ManageBookTagsDialog"
import { ManageTagBooksDialog } from "./tags/ManageTagBooksDialog"
import { useRef } from "react"
import { Effects } from "./Effects"
import { bookBeingReadStatePersist } from "./reading/states"
import { readerSettingsStatePersist } from "./reader/settings/states"
import {
  PersistSignals,
  ReactjrxQueryProvider,
  createLocalforageAdapter,
  createSharedStoreAdapter
} from "reactjrx"
import { libraryStatePersist, setSyncState } from "./library/states"
import localforage from "localforage"
import { RecoilRoot } from "recoil"

declare module "@mui/styles/defaultTheme" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultTheme extends Theme {}
}

export function App() {
  const [loading, setLoading] = useState({
    hydrate: true,
    preloadQueries: true
  })
  const [newServiceWorker, setNewServiceWorker] = useState<
    ServiceWorker | undefined
  >(undefined)
  const isAppReady = !loading.hydrate && !loading.preloadQueries

  return (
    <ErrorBoundary
      onError={(e) => {
        console.error(e)
      }}
    >
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <ReactjrxQueryProvider>
            <Suspense fallback={<AppLoading />}>
              {!isAppReady && <AppLoading />}
              <RxDbProvider>
                <RecoilRoot>
                  <PersistSignals
                    signals={[
                      libraryStatePersist,
                      normalizedBookDownloadsStatePersist,
                      firstTimeExperienceStatePersist,
                      localSettingsStatePersist,
                      authStatePersist,
                      bookBeingReadStatePersist,
                      readerSettingsStatePersist
                    ]}
                    adapter={createSharedStoreAdapter({
                      adapter: createLocalforageAdapter(localforage),
                      key: "local-user2"
                    })}
                    onReady={() => {
                      setLoading((state) => ({ ...state, hydrate: false }))
                    }}
                  >
                    {plugins.reduce(
                      (Comp, { Provider }) => {
                        if (Provider) {
                          return <Provider>{Comp}</Provider>
                        }
                        return Comp
                      },
                      <AxiosProvider>
                        <DialogProvider>
                          <TourProvider>
                            <AppNavigator />
                            <FirstTimeExperienceTours />
                            <ManageBookCollectionsDialog />
                            <ManageBookTagsDialog />
                            <ManageTagBooksDialog />
                          </TourProvider>
                          <UpdateAvailableDialog
                            serviceWorker={newServiceWorker}
                          />
                          <RecoilSyncedWithDatabase />
                          <BlockingBackdrop />
                          <Effects />
                        </DialogProvider>
                      </AxiosProvider>
                    )}
                  </PersistSignals>
                  <PreloadQueries
                    onReady={() => {
                      setLoading((state) => ({
                        ...state,
                        preloadQueries: false
                      }))
                    }}
                  />
                </RecoilRoot>
              </RxDbProvider>
            </Suspense>
          </ReactjrxQueryProvider>
        </ThemeProvider>
      </StyledEngineProvider>
      <ServiceWorkerRegistration
        onUpdateAvailable={(sw) => setNewServiceWorker(sw)}
      />
      <BlurContainer />
    </ErrorBoundary>
  )
}

const RecoilSyncedWithDatabase: FC = () => {
  useObservers()

  return null
}

const ServiceWorkerRegistration: FC<{
  onUpdateAvailable: (sw: ServiceWorker) => void
}> = ({ onUpdateAvailable }) => {
  const firstTime = useRef(true)

  useEffect(() => {
    if (firstTime.current) {
      firstTime.current = false
      // If you want your app to work offline and load faster, you can change
      // unregister() to register() below. Note this comes with some pitfalls.
      // Learn more about service workers: https://cra.link/PWA
      serviceWorkerRegistration.register({
        onSuccess: () => console.warn("onSuccess"),
        onUpdate: (reg) => reg.waiting && onUpdateAvailable(reg.waiting),
        onWaitingServiceWorkerFound: async (reg) => {
          reg.waiting && onUpdateAvailable(reg.waiting)
        }
      })
    }
  }, [onUpdateAvailable])

  return null
}
