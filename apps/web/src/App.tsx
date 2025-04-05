import { memo, Suspense, useEffect, useState } from "react"
import { AppNavigator } from "./navigation/AppNavigator"
import { StyledEngineProvider, Fade, Box } from "@mui/material"
import { BlockingBackdrop } from "./common/BlockingBackdrop"
import { ManageBookCollectionsDialog } from "./books/ManageBookCollectionsDialog"
import { plugins } from "./plugins/configure"
import { UpdateAvailableDialog } from "./workers/UpdateAvailableDialog"
import { PreloadQueries } from "./queries/PreloadQueries"
import { SplashScreen } from "./common/SplashScreen"
import { BlurFilterReference } from "./books/BlurFilterReference"
import { ErrorBoundary } from "@sentry/react"
import { ManageBookTagsDialog } from "./books/ManageBookTagsDialog"
import { ManageTagBooksDialog } from "./tags/ManageTagBooksDialog"
import { usePersistSignals, QueryClientProvider$, useObserve } from "reactjrx"
import { signalEntriesToPersist } from "./profile"
import { queryClient } from "./queries/queryClient"
import { ThemeProvider } from "./theme/ThemeProvider"
import { AuthorizeActionDialog } from "./auth/AuthorizeActionDialog"
import { BackgroundReplication } from "./rxdb/replication/BackgroundReplication"
import { useProfileStorage } from "./profile/storage"
import { usePersistAuthState } from "./auth/states.web"
import { DialogProvider } from "./common/dialogs/DialogProvider"
import { useRegisterServiceWorker } from "./workers/useRegisterServiceWorker"
import { Archive as LibArchive } from "libarchive.js"
import { RxDbProvider } from "./rxdb/RxDbProvider"
import { Logger } from "./debug/logger.shared"
import { RestoreDownloadState } from "./download/RestoreDownloadState"
import { useCleanupDanglingLinks } from "./links/useCleanupDanglingLinks"
import { useRemoveDownloadWhenBookIsNotInterested } from "./download/useRemoveDownloadWhenBookIsNotInterested"
import { QueryClientProvider } from "@tanstack/react-query"
import { configuration } from "./config/configuration"
import { useLoadGsi } from "./google/gsi"
import { AuthGuard } from "./auth/AuthGuard"
import { NotificationsProvider } from "./notifications/NotificationsProvider"
import { SetupSecretDialog } from "./secrets/SetupSecretDialog"

// @todo move to sw
LibArchive.init({
  workerUrl: "/libarchive.js.worker-bundle.js",
})

export const App = memo(() => {
  const [isPreloadingQueries, setIsPreloadingQueries] = useState(true)
  const [isDownloadsHydrated, setIsDownloadsHydrated] = useState(false)
  const { waitingWorker } = useRegisterServiceWorker()
  const profileSignalStorageAdapter = useProfileStorage()

  const { isHydrated: isProfileHydrated } = usePersistSignals({
    adapter: profileSignalStorageAdapter,
    entries: signalEntriesToPersist,
  })

  const { isHydrated: isAuthHydrated } = usePersistAuthState()

  const isHydratingProfile = !!profileSignalStorageAdapter && !isProfileHydrated
  const isAppReady =
    isDownloadsHydrated && isAuthHydrated && !isPreloadingQueries

  return (
    <ErrorBoundary
      onError={(e) => {
        Logger.error(e)
      }}
    >
      <StyledEngineProvider injectFirst>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <QueryClientProvider$>
              <Suspense fallback={<SplashScreen show />}>
                <DialogProvider>
                  {!isHydratingProfile &&
                    isAuthHydrated &&
                    plugins.reduce(
                      (Comp, { Provider }) => {
                        if (Provider) {
                          return <Provider>{Comp}</Provider>
                        }
                        return Comp
                      },
                      <Fade in={isAppReady}>
                        <Box height="100%">
                          <AuthGuard />
                          <AppNavigator isProfileHydrated={isProfileHydrated} />
                          <ManageBookCollectionsDialog />
                          <ManageBookTagsDialog />
                          <ManageTagBooksDialog />
                          <AuthorizeActionDialog />
                          <SetupSecretDialog />
                          <UpdateAvailableDialog
                            serviceWorker={waitingWorker}
                          />
                          <BackgroundReplication />
                          <BlockingBackdrop />
                          <Effects />
                        </Box>
                      </Fade>,
                    )}
                  <PreloadQueries
                    onReady={() => {
                      setIsPreloadingQueries(false)
                    }}
                  />
                  <RestoreDownloadState
                    onReady={() => {
                      setIsDownloadsHydrated(true)
                    }}
                  />
                  <NotificationsProvider />
                  <RxDbProvider />
                </DialogProvider>
              </Suspense>
            </QueryClientProvider$>
          </QueryClientProvider>
        </ThemeProvider>
      </StyledEngineProvider>
      <BlurFilterReference />
    </ErrorBoundary>
  )
})

export const AppWithConfig = memo(() => {
  const config = useObserve(configuration.loaded$)

  return config ? <App /> : null
})

const Effects = memo(() => {
  useCleanupDanglingLinks()
  useRemoveDownloadWhenBookIsNotInterested()
  const { mutate: loadGsi } = useLoadGsi()

  useEffect(() => {
    loadGsi()
  }, [loadGsi])

  return null
})
