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
import { DesktopDrawer } from "./DesktopDrawer"
import { ProfileScreen } from "../pages/profile/ProfileScreen"
import { ManageStorageScreen } from "../pages/profile/manage-storage/ManageStorageScreen"
import { LibraryTopTabNavigator } from "../library/LibraryTopTabNavigator"
import { BookDetailsScreen } from "../books/details/BookDetailsScreen"
import { CollectionDetailsScreen } from "../pages/collections/CollectionDetailsScreen/CollectionDetailsScreen"
import { DataSourcesListScreen } from "../pages/sync/DataSourcesListScreen"
import { SearchScreen } from "../pages/SearchScreen"
import { SettingsScreen } from "../pages/SettingsScreen"
import { StatisticsScreen } from "../pages/StatisticsScreen"
import { ProblemsScreen } from "../problems/ProblemsScreen"
import { LibraryBooksScreen } from "../library/books/LibraryBooksScreen"
import { LibraryCollectionScreen } from "../pages/LibraryCollectionScreen"
import { LibraryTagsScreen } from "../pages/library/LibraryTagsScreen"
import { TagBooksScreen } from "../pages/library/tags/$id/books/TagBooksScreen"
import { CollectionBooksScreen } from "../pages/collections/$id/books/CollectionBooksScreen"
import { memo, useEffect, useRef, type ReactNode } from "react"
import { useMediaQuery, useTheme } from "@mui/material"
import { SearchScreenExpanded } from "../search/SearchScreenExpanded"
import { useSignalValue } from "reactjrx"
import { authStateSignal } from "../auth/states.web"
import { DataSourcesTabNavigator } from "../dataSources/DataSourcesTabNavigator"
import { DataSourcesReportsScreen } from "../dataSources/reports/DataSourcesReportsScreen"
import { SecurityScreen } from "../pages/profile/SecurityScreen"
import { PluginsScreen } from "../plugins/common/PluginsScreen"
import { PluginScreen } from "../plugins/common/PluginScreen"
import { ROUTES } from "./routes"
import { SignUpScreen } from "../pages/SignUpScreen"
import { SecretsScreen } from "../pages/profile/SecretsScreen"
import { NewDataSourceScreen } from "../pages/sync/NewDataSourceScreen"
import { DataSourceDetailsScreen } from "../pages/sync/DataSourceDetailsScreen"
import { AddConnectorScreen } from "../connectors/AddConnectorScreen"
import { EditConnectorScreen } from "../connectors/EditConnectorScreen"
import { plugins } from "../dataSources"
import { SignUpCompleteScreen } from "../pages/SignUpCompleteScreen"
import { MagicLinkCompleteScreen } from "../pages/MagicLinkCompleteScreen"
import { NotificationsScreen } from "../notifications/inbox/NotificationsScreen"

const AppShell = ({ children }: { children: ReactNode }) => {
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"))

  if (isDesktop) {
    return <DesktopDrawer>{children}</DesktopDrawer>
  }

  return <>{children}</>
}

const AppShellRouteWrapper = () => (
  <AppShell>
    <Outlet />
  </AppShell>
)

const MobileTabBar = ({ children }: { children: ReactNode }) => {
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"))

  if (isDesktop) {
    return <>{children}</>
  }

  return <BottomTabBar>{children}</BottomTabBar>
}

const MobileTabBarRouteWrapper = () => (
  <MobileTabBar>
    <Outlet />
  </MobileTabBar>
)

export const AppBrowserRouter = ({ children }: { children: ReactNode }) => {
  const auth = useSignalValue(authStateSignal)
  const isAuthenticated = !!auth?.accessToken

  const content = (
    <>
      <Routes>
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
            <Route path="*" element={<AppShellRouteWrapper />}>
              <Route
                path={`${ROUTES.PROBLEMS.slice(1)}`}
                element={<ProblemsScreen />}
              />
              <Route
                path={ROUTES.BOOK_DETAILS.slice(1)}
                element={<BookDetailsScreen />}
              />
              <Route
                path={ROUTES.COLLECTION_DETAILS.slice(1)}
                element={<CollectionDetailsScreen />}
              />
              <Route
                path={ROUTES.TAG_BOOKS.slice(1)}
                element={<TagBooksScreen />}
              />
              <Route
                path={ROUTES.COLLECTION_BOOKS.slice(1)}
                element={<CollectionBooksScreen />}
              />
              <Route path={ROUTES.SEARCH.slice(1)}>
                <Route index element={<SearchScreen />} />
                <Route
                  path=":search/:type"
                  element={<SearchScreenExpanded />}
                />
              </Route>
              <Route
                path="profile/manage-storage"
                element={<ManageStorageScreen />}
              />
              <Route
                path={ROUTES.NOTIFICATIONS.slice(1)}
                element={<NotificationsScreen />}
              />
              <Route
                path={ROUTES.SECURITY.slice(1)}
                element={<SecurityScreen />}
              />
              <Route
                path={ROUTES.SECRETS.slice(1)}
                element={<SecretsScreen />}
              />
              <Route
                path={ROUTES.SETTINGS.slice(1)}
                element={<SettingsScreen />}
              />
              <Route
                path={ROUTES.STATISTICS.slice(1)}
                element={<StatisticsScreen />}
              />
              <Route
                path={ROUTES.PLUGINS_TYPE.slice(1)}
                element={<PluginScreen />}
              />
              <Route
                path={ROUTES.PLUGINS_CONNECTORS_NEW.slice(1)}
                element={<AddConnectorScreen />}
              />
              <Route
                path={ROUTES.PLUGINS_CONNECTORS_EDIT.slice(1)}
                element={<EditConnectorScreen />}
              />
              <Route
                path={ROUTES.SYNC_NEW_DATASOURCES.slice(1)}
                element={<NewDataSourceScreen />}
              />
              <Route
                path={ROUTES.DATASOURCE_DETAILS.slice(1)}
                element={<DataSourceDetailsScreen />}
              />
              <Route path="*" element={<MobileTabBarRouteWrapper />}>
                <Route index element={<HomeScreen />} />
                <Route path="profile" element={<ProfileScreen />} />
                <Route path="plugins" element={<PluginsScreen />} />
                <Route path="library" element={<LibraryTopTabNavigator />}>
                  <Route index element={<Navigate to="books" replace />} />
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
                    element={<Navigate to="datasources" replace />}
                  />
                  <Route
                    path="datasources"
                    element={<DataSourcesListScreen />}
                  />
                  <Route
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
            </Route>
          </>
        ) : (
          <>
            <Route path={ROUTES.LOGIN} element={<LoginScreen />} />
            <Route path={ROUTES.SIGN_UP} element={<SignUpScreen />} />
            <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
          </>
        )}
      </Routes>
      {children}
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
