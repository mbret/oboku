import { Suspense, useState } from "react"
import { AppNavigator } from "./navigation/AppNavigator"
import { Theme, StyledEngineProvider, Fade, Box } from "@mui/material"
import { BlockingBackdrop } from "./common/BlockingBackdrop"
import { TourProvider } from "./app-tour/TourProvider"
import { ManageBookCollectionsDialog } from "./books/ManageBookCollectionsDialog"
import { plugins } from "./plugins/configure"
import { UpdateAvailableDialog } from "./workers/UpdateAvailableDialog"
import { PreloadQueries } from "./PreloadQueries"
import { SplashScreen } from "./SplashScreen"
import { FirstTimeExperienceTours } from "./firstTimeExperience/FirstTimeExperienceTours"
import { BlurFilterReference } from "./books/BlurFilterReference"
import "./i18n"
import { ErrorBoundary } from "@sentry/react"
import { ManageBookTagsDialog } from "./books/ManageBookTagsDialog"
import { ManageTagBooksDialog } from "./tags/ManageTagBooksDialog"
import { Effects } from "./Effects"
import {
  usePersistSignals,
  QueryClientProvider,
  useSignalValue
} from "reactjrx"
import { signalEntriesToPersist } from "./profile"
import { queryClient } from "./queries/queryClient"
import { ThemeProvider } from "./theme/ThemeProvider"
import { AuthorizeActionDialog } from "./auth/AuthorizeActionDialog"
import { BackgroundReplication } from "./rxdb/replication/BackgroundReplication"
import { profileStorageSignal } from "./profile/storage"
import { authSignalStorageAdapter } from "./auth/storage"
import { authStateSignal } from "./auth/authState"
import { DialogProvider } from "./common/dialogs/DialogProvider"
import { useRegisterServiceWorker } from "./workers/useRegisterServiceWorker"
import { Archive as LibArchive } from "libarchive.js"
import { RxDbProvider } from "./rxdb/RxDbProvider"
import { Report } from "./debug/report.shared"

// @todo move to sw
LibArchive.init({
  workerUrl: "/libarchive.js.worker-bundle.js"
})

declare module "@mui/styles/defaultTheme" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultTheme extends Theme {}
}

const authSignalEntries = [{ signal: authStateSignal, version: 0 }]

export function App() {
  const [loading, setLoading] = useState({
    isPreloadingQueries: true
  })
  const { waitingWorker } = useRegisterServiceWorker()
  const profileSignalStorageAdapter = useSignalValue(profileStorageSignal)

  const { isHydrated: isProfileHydrated } = usePersistSignals({
    adapter: profileSignalStorageAdapter,
    entries: signalEntriesToPersist
  })

  const { isHydrated: isAuthHydrated } = usePersistSignals({
    adapter: authSignalStorageAdapter,
    entries: authSignalEntries
  })

  const isHydratingProfile = !!profileSignalStorageAdapter && !isProfileHydrated
  const isAppReady = isAuthHydrated && !loading.isPreloadingQueries

  return (
    <ErrorBoundary
      onError={(e) => {
        Report.error(e)
      }}
    >
      <StyledEngineProvider injectFirst>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <Suspense fallback={<SplashScreen show />}>
              {/* <SplashScreen show={!isAppReady} /> */}
              {!isHydratingProfile && isAuthHydrated && (
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
                            <AppNavigator
                              isProfileHydrated={isProfileHydrated}
                            />
                            <FirstTimeExperienceTours />
                            <ManageBookCollectionsDialog />
                            <ManageBookTagsDialog />
                            <ManageTagBooksDialog />
                            <AuthorizeActionDialog />
                          </TourProvider>
                          <UpdateAvailableDialog
                            serviceWorker={waitingWorker}
                          />
                          <BackgroundReplication />
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
                    isPreloadingQueries: false
                  }))
                }}
              />
              <RxDbProvider />
            </Suspense>
          </QueryClientProvider>
        </ThemeProvider>
      </StyledEngineProvider>
      <BlurFilterReference />
    </ErrorBoundary>
  )
}
