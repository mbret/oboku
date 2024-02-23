import { FC, Suspense, useEffect, useState } from "react"
import { AppNavigator } from "./navigation/AppNavigator"
import {
  ThemeProvider,
  Theme,
  StyledEngineProvider,
  Fade,
  Box
} from "@mui/material"
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
import { SplashScreen } from "./SplashScreen"
import { FirstTimeExperienceTours } from "./firstTimeExperience/FirstTimeExperienceTours"
import { DialogProvider } from "./dialog"
import { BlurContainer } from "./books/BlurContainer"
import "./i18n"
import { ErrorBoundary } from "@sentry/react"
import { ManageBookTagsDialog } from "./books/ManageBookTagsDialog"
import { ManageTagBooksDialog } from "./tags/ManageTagBooksDialog"
import { useRef } from "react"
import { Effects } from "./Effects"
import {
  usePersistSignals,
  QueryClientProvider,
  createLocalforageAdapter,
  createSharedStoreAdapter
} from "reactjrx"
import localforage from "localforage"
import { signalEntriesToPersist } from "./storage"
import { queryClient } from "./queries/client"

declare module "@mui/styles/defaultTheme" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultTheme extends Theme {}
}

export function App() {
  const [loading, setLoading] = useState({
    isHydrating: true,
    preloadQueries: true
  })
  const [newServiceWorker, setNewServiceWorker] = useState<
    ServiceWorker | undefined
  >(undefined)
  const isAppReady = !loading.isHydrating && !loading.preloadQueries

  const { isHydrated } = usePersistSignals({
    adapter: createSharedStoreAdapter({
      adapter: createLocalforageAdapter(localforage),
      key: "local-user"
    }),
    onReady: () => {
      setLoading((state) => ({ ...state, isHydrating: false }))
    },
    entries: signalEntriesToPersist
  })

  return (
    <ErrorBoundary
      onError={(e) => {
        console.error(e)
      }}
    >
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <QueryClientProvider client={queryClient}>
            <Suspense fallback={<SplashScreen show />}>
              {/* <SplashScreen show={!isAppReady} /> */}
              <RxDbProvider>
                {isHydrated && (
                  <>
                    {plugins.reduce(
                      (Comp, { Provider }) => {
                        if (Provider) {
                          return <Provider>{Comp}</Provider>
                        }
                        return Comp
                      },
                      <Fade in={isAppReady}>
                        <Box height="100%">
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
                            <ReplicateRemoteDb />
                            <BlockingBackdrop />
                            <Effects />
                          </DialogProvider>
                        </Box>
                      </Fade>
                    )}
                  </>
                )}

                <PreloadQueries
                  onReady={() => {
                    setLoading((state) => ({
                      ...state,
                      preloadQueries: false
                    }))
                  }}
                />
              </RxDbProvider>
            </Suspense>
          </QueryClientProvider>
        </ThemeProvider>
      </StyledEngineProvider>
      <ServiceWorkerRegistration
        onUpdateAvailable={(sw) => setNewServiceWorker(sw)}
      />
      <BlurContainer />
    </ErrorBoundary>
  )
}

const ReplicateRemoteDb: FC = () => {
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
