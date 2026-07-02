import { memo, useEffect, useState } from "react"
import { AppBrowserRouter } from "./navigation/AppBrowserRouter"
import { StyledEngineProvider, Fade, Box } from "@mui/material"
import { BlockingBackdrop } from "./common/locks/BlockingBackdrop"
import { UpdateAvailableDialog } from "./workers/UpdateAvailableDialog"
import { PreloadQueries } from "./queries/PreloadQueries"
import { BlurFilterReference } from "./books/BlurFilterReference"
import { ErrorBoundary } from "@sentry/react"
import { usePersistSignals, QueryClientProvider$ } from "reactjrx"
import { signalEntriesToPersist, useProfileStorage } from "./profiles"
import { ThemeProvider } from "./theme/ThemeProvider"
import { AuthorizeActionDialog } from "./auth/AuthorizeActionDialog"
import { BackgroundReplication } from "./rxdb/replication/BackgroundReplication"
import { usePersistAuthState } from "./auth/states.web"
import { DialogProvider } from "./common/dialogs/DialogProvider"
import { useRegisterServiceWorker } from "./workers/useRegisterServiceWorker"
import { Archive as LibArchive } from "libarchive.js"
import { RxDbProvider } from "./rxdb/RxDbProvider"
import { Logger } from "./debug/logger.shared"
import { RestoreDownloadState } from "./download/RestoreDownloadState"
import { useCleanupDanglingLinks } from "./links/useCleanupDanglingLinks"
import { useRemoveDownloadWhenBookIsNotInterested } from "./download/useRemoveDownloadWhenBookIsNotInterested"
import { QueryClientProvider } from "./queries/QueryClientProvider"
import { LoadConfiguration } from "./config/LoadConfiguration"
import { useLoadGsi } from "./google/gsi"
import { Toasts } from "./notifications/toasts/Toasts"
import { SetupSecretDialog } from "./secrets/SetupSecretDialog"
import { DebugMenu } from "./debug/DebugMenu"
import { BackToReadingDialog } from "./reading/BackToReadingDialog"
import { PluginDownloadFlowHost } from "./download/flow/PluginDownloadFlowHost"
import { CollectionActionsDrawer } from "./collections/CollectionActionsDrawer/CollectionActionsDrawer"
import { BookActionsDrawer } from "./books/drawer/BookActionsDrawer"
import { UploadBookDialogWithDragOver } from "./upload/UploadBookDialogWithDragOver"
import { WithAuthentication } from "./auth/WithAuthentication"
import { NotifyExpiredSession } from "./auth/NotifyExpiredSession"
import { HttpClientApiProvider } from "./http"
import { ServiceWorkerMessages } from "./workers/communication/ServiceWorkerMessages"
import { AddTagDialog } from "./tags/AddTagDialog"
import { AddCollectionDialog } from "./library/shelves/AddCollectionDialog"

// @todo move to sw
LibArchive.init({
  workerUrl: "/libarchive.js.worker-bundle.js",
})

const App = memo(() => {
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
    <DialogProvider>
      {!isHydratingProfile && isAuthHydrated && (
        <Fade in={isAppReady} timeout={500}>
          <Box
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <AppBrowserRouter>
              <WithAuthentication>
                <UploadBookDialogWithDragOver />
                <BookActionsDrawer />
                <CollectionActionsDrawer />
                <PluginDownloadFlowHost />
                <BackToReadingDialog isProfileHydrated={isProfileHydrated} />
                <SetupSecretDialog />
                <AddTagDialog />
                <AddCollectionDialog />
              </WithAuthentication>
              <AuthorizeActionDialog />
              <BackgroundReplication />
              <BlockingBackdrop />
              <NotifyExpiredSession />
              <OtherEffects />
            </AppBrowserRouter>
          </Box>
        </Fade>
      )}
      <UpdateAvailableDialog serviceWorker={waitingWorker} />
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
      <Toasts />
      <RxDbProvider />
    </DialogProvider>
  )
})

export const AppWithConfig = memo(() => {
  return (
    <ErrorBoundary
      onError={(e) => {
        Logger.error(e)
      }}
    >
      <StyledEngineProvider injectFirst>
        <ThemeProvider>
          <HttpClientApiProvider>
            <QueryClientProvider>
              <QueryClientProvider$>
                <ServiceWorkerMessages />
                <LoadConfiguration>
                  <App />
                </LoadConfiguration>
                {import.meta.env.DEV && <DebugMenu />}
              </QueryClientProvider$>
            </QueryClientProvider>
          </HttpClientApiProvider>
        </ThemeProvider>
      </StyledEngineProvider>
      <BlurFilterReference />
    </ErrorBoundary>
  )
})

const OtherEffects = memo(() => {
  useCleanupDanglingLinks()
  useRemoveDownloadWhenBookIsNotInterested()
  const { mutate: loadGsi } = useLoadGsi()

  useEffect(() => {
    loadGsi()
  }, [loadGsi])

  return null
})
