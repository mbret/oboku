import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router"
import { HomeScreen } from "../pages/HomeScreen"
import { LoginScreen } from "../pages/LoginScreen"
import { ReaderScreen } from "../reader/ReaderScreen"
import { BottomTabBar } from "./BottomTabBar"
import { ProfileScreen } from "../pages/profile/ProfileScreen"
import { ManageStorageScreen } from "../pages/profile/manage-storage/ManageStorageScreen"
import { LibraryTopTabNavigator } from "../library/LibraryTopTabNavigator"
import { BookDetailsScreen } from "../books/details/BookDetailsScreen"
import { CollectionDetailsScreen } from "../pages/collections/CollectionDetailsScreen/CollectionDetailsScreen"
import { BookActionsDrawer } from "../books/drawer/BookActionsDrawer"
import { DataSourcesListScreen } from "../pages/sync/DataSourcesListScreen"
import { SearchScreen } from "../pages/SearchScreen"
import { AuthCallbackScreen } from "../pages/AuthCallbackScreen"
import { SettingsScreen } from "../pages/SettingsScreen"
import { StatisticsScreen } from "../pages/StatisticsScreen"
import { BackToReadingDialog } from "../reading/BackToReadingDialog"
import { ProblemsScreen } from "../problems/ProblemsScreen"
import { LibraryBooksScreen } from "../library/books/LibraryBooksScreen"
import { LibraryCollectionScreen } from "../pages/LibraryCollectionScreen"
import { LibraryTagsScreen } from "../pages/library/LibraryTagsScreen"
import { memo, useEffect, useRef } from "react"
import { SearchScreenExpanded } from "../search/SearchScreenExpanded"
import { useSignalValue } from "reactjrx"
import { authStateSignal } from "../auth/states.web"
import { DataSourcesTabNavigator } from "../dataSources/DataSourcesTabNavigator"
import { DataSourcesReportsScreen } from "../dataSources/reports/DataSourcesReportsScreen"
import { SecurityScreen } from "../pages/profile/SecurityScreen"
import { PluginsScreen } from "../plugins/PluginsScreen"
import { PluginScreen } from "../plugins/PluginScreen"
import { CollectionActionsDrawer } from "../collections/CollectionActionsDrawer/CollectionActionsDrawer"
import { ROUTES } from "./routes"
import { SignUpScreen } from "../pages/SignUpScreen"
import { SecretsScreen } from "../pages/profile/SecretsScreen"
import { NewDataSourceScreen } from "../pages/sync/NewDataSourceScreen"
import { AddWebdavConnectorScreen } from "../pages/plugins/webdav/AddWebdavConnectorScreen"
import { EditWebDavConnectorScreen } from "../pages/plugins/webdav/EditWebdavConnectorScreen"
import { DataSourceDetailsScreen } from "../pages/sync/DataSourceDetailsScreen"
import { AddSynologyDriveConnectorScreen } from "../pages/plugins/synology-drive/AddConnectorScreen"
import { EditSynologyDriveConnectorScreen } from "../pages/plugins/synology-drive/EditConnectorScreen"
import { PluginDownloadFlowHost } from "../download/flow/PluginDownloadFlowHost"
import { plugins } from "../dataSources"
import { SignUpCompleteScreen } from "../pages/SignUpCompleteScreen"
import { MagicLinkCompleteScreen } from "../pages/MagicLinkCompleteScreen"

const BottomTabBarRouteWrapper = () => (
  <BottomTabBar>
    <Outlet />
  </BottomTabBar>
)

export const AppNavigator = ({
  isProfileHydrated,
}: {
  isProfileHydrated: boolean
}) => {
  const auth = useSignalValue(authStateSignal)
  const isAuthenticated = !!auth?.accessToken

  const content = (
    <>
      <div
        style={{
          flexShrink: 0,
          height: "100%",
          flex: 1,
          flexDirection: "column",
          display: "flex",
        }}
      >
        <Routes>
          <Route path={ROUTES.AUTH_CALLBACK} element={<AuthCallbackScreen />} />
          <Route
            path={ROUTES.LOGIN_MAGIC_LINK}
            element={<MagicLinkCompleteScreen />}
          />
          <Route
            path={ROUTES.SIGN_UP_COMPLETE}
            element={<SignUpCompleteScreen />}
          />
          {isAuthenticated ? (
            <>
              <Route path="/reader/:bookId" element={<ReaderScreen />} />
              <Route path={`${ROUTES.PROBLEMS}`} element={<ProblemsScreen />} />
              <Route
                path={ROUTES.BOOK_DETAILS}
                element={<BookDetailsScreen />}
              />
              <Route
                path={ROUTES.COLLECTION_DETAILS}
                element={<CollectionDetailsScreen />}
              />
              <Route path={ROUTES.SEARCH}>
                <Route index element={<SearchScreen />} />
                <Route
                  path=":search/:type"
                  element={<SearchScreenExpanded />}
                />
              </Route>
              <Route
                path={`${ROUTES.PROFILE}/manage-storage`}
                element={<ManageStorageScreen />}
              />
              <Route path="plugins/:type" element={<PluginScreen />} />
              <Route
                path={ROUTES.PLUGINS_WEBDAV_CONNECTORS_NEW}
                element={<AddWebdavConnectorScreen />}
              />
              <Route
                path={ROUTES.PLUGINS_WEBDAV_CONNECTORS_EDIT}
                element={<EditWebDavConnectorScreen />}
              />
              <Route
                path={ROUTES.PLUGINS_SYNOLOGY_DRIVE_CONNECTORS_NEW}
                element={<AddSynologyDriveConnectorScreen />}
              />
              <Route
                path={ROUTES.PLUGINS_SYNOLOGY_DRIVE_CONNECTORS_EDIT}
                element={<EditSynologyDriveConnectorScreen />}
              />
              <Route path={`${ROUTES.SECURITY}`} element={<SecurityScreen />} />
              <Route path={`${ROUTES.SECRETS}`} element={<SecretsScreen />} />
              <Route path={`${ROUTES.SETTINGS}`} element={<SettingsScreen />} />
              <Route
                path={`${ROUTES.STATISTICS}`}
                element={<StatisticsScreen />}
              />
              <Route
                path={ROUTES.SYNC_NEW_DATASOURCES}
                element={<NewDataSourceScreen />}
              />
              <Route
                path={ROUTES.DATASOURCE_DETAILS}
                element={<DataSourceDetailsScreen />}
              />
              <Route path="*" element={<BottomTabBarRouteWrapper />}>
                <Route index element={<HomeScreen />} />
                <Route path="profile" element={<ProfileScreen />} />
                <Route path="plugins" element={<PluginsScreen />} />
                <Route path="library" element={<LibraryTopTabNavigator />}>
                  <Route path="books" element={<LibraryBooksScreen />} />
                  <Route
                    path="collections"
                    element={<LibraryCollectionScreen />}
                  />
                  <Route path="tags" element={<LibraryTagsScreen />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
                <Route path="sync" element={<DataSourcesTabNavigator />}>
                  <Route
                    index
                    path="datasources"
                    element={<DataSourcesListScreen />}
                  />
                  <Route
                    index
                    path="reports"
                    element={<DataSourcesReportsScreen />}
                  />

                  <Route
                    path="*"
                    element={<Navigate to={ROUTES.SYNC_DATASOURCES} replace />}
                  />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </>
          ) : (
            <>
              <Route path={ROUTES.LOGIN} element={<LoginScreen />} />
              <Route path={ROUTES.SIGN_UP} element={<SignUpScreen />} />
              <Route
                path="*"
                element={<Navigate to={ROUTES.LOGIN} replace />}
              />
            </>
          )}
        </Routes>
      </div>
      <BookActionsDrawer />
      <CollectionActionsDrawer />
      <PluginDownloadFlowHost />
      <BackToReadingDialog isProfileHydrated={isProfileHydrated} />
      <TrackHistoryCanGoBack />
    </>
  )

  return (
    <BrowserRouter>
      {plugins.reduce((Comp, { Provider }, index) => {
        if (Provider) {
          return <Provider key={index}>{Comp}</Provider>
        }
        return Comp
      }, content)}
    </BrowserRouter>
  )
}

const TrackHistoryCanGoBack = memo(() => {
  const { pathname, state } = useLocation()
  const isFirstChange = useRef(true)

  useEffect(() => {
    return () => {
      // concurrent bug ?
      // we have to reset the ref for next mount, no idea why
      isFirstChange.current = true
    }
  }, [])

  useEffect(() => {
    void pathname

    if (!isFirstChange.current && !state?.__obokuFallbackBack) {
      window.history.replaceState(
        {
          ...window.history.state,
          __obokuCanGoBack: true,
        },
        ``,
      )
    }
    isFirstChange.current = false
  }, [pathname, state])

  return null
})
