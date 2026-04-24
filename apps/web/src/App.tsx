import { memo, useEffect, useState } from "react"
import { AppBrowserRouter } from "./navigation/AppBrowserRouter"
import { StyledEngineProvider, Fade, Box } from "@mui/material"
import { BlockingBackdrop } from "./common/locks/BlockingBackdrop"
import { ManageBookCollectionsDialog } from "./books/ManageBookCollectionsDialog"
import { UpdateAvailableDialog } from "./workers/UpdateAvailableDialog"
import { PreloadQueries } from "./queries/PreloadQueries"
import { BlurFilterReference } from "./books/BlurFilterReference"
import { ErrorBoundary } from "@sentry/react"
import { ManageBookTagsDialog } from "./books/ManageBookTagsDialog"
import { usePersistSignals, QueryClientProvider$ } from "reactjrx"
import { signalEntriesToPersist } from "./profile"
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
import { PersistQueryProvider } from "./queries/PersistQueryProvider"
import { LoadConfiguration } from "./config/LoadConfiguration"
import { useLoadGsi } from "./google/gsi"
import { AutoSignOutWhenUnauthorized } from "./auth/AutoSignOutWhenUnauthorized"
import { Toasts } from "./notifications/toasts/Toasts"
import { SetupSecretDialog } from "./secrets/SetupSecretDialog"
import { DebugMenu } from "./debug/DebugMenu"
import { BackToReadingDialog } from "./reading/BackToReadingDialog"
import { PluginDownloadFlowHost } from "./download/flow/PluginDownloadFlowHost"
import { CollectionActionsDrawer } from "./collections/CollectionActionsDrawer/CollectionActionsDrawer"
import { BookActionsDrawer } from "./books/drawer/BookActionsDrawer"
import { UploadBookDialogWithDragOver } from "./upload/UploadBookDialogWithDragOver"
import { AuthenticatedOnly } from "./auth/AuthenticatedOnly"

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
              {/* This needs to be high enough to catch at least any early calls to `httpClientApi` */}
              <AutoSignOutWhenUnauthorized />
              <AuthenticatedOnly>
                <UploadBookDialogWithDragOver />
                <BookActionsDrawer />
                <CollectionActionsDrawer />
                <PluginDownloadFlowHost />
                <BackToReadingDialog isProfileHydrated={isProfileHydrated} />
                <ManageBookCollectionsDialog />
                <ManageBookTagsDialog />
                <SetupSecretDialog />
              </AuthenticatedOnly>
              <AuthorizeActionDialog />
              <BackgroundReplication />
              <BlockingBackdrop />
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
          <PersistQueryProvider>
            <QueryClientProvider$>
              <LoadConfiguration>
                <App />
              </LoadConfiguration>
              {import.meta.env.DEV && <DebugMenu />}
            </QueryClientProvider$>
          </PersistQueryProvider>
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
