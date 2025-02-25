import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router"
import { HomeScreen } from "../home/HomeScreen"
import { LoginScreen } from "../auth/LoginScreen"
import { ReaderScreen } from "../reader/ReaderScreen"
import { BottomTabBar } from "./BottomTabBar"
import { ProfileScreen } from "../settings/ProfileScreen"
import { ManageStorageScreen } from "../settings/ManageStorageScreen"
import { LibraryTopTabNavigator } from "../library/LibraryTopTabNavigator"
import { ROUTES } from "../constants.web"
import { BookDetailsScreen } from "../books/details/BookDetailsScreen"
import { CollectionDetailsScreen } from "../collections/details/CollectionDetailsScreen"
import { BookActionsDrawer } from "../books/drawer/BookActionsDrawer"
import { DataSourcesListScreen } from "../dataSources/DataSourcesListScreen"
import { SearchScreen } from "../search/SearchScreen"
import { AuthCallbackScreen } from "../auth/AuthCallbackScreen"
import { SettingsScreen } from "../settings/SettingsScreen"
import { StatisticsScreen } from "../settings/StatisticsScreen"
import { BackToReadingDialog } from "../reading/BackToReadingDialog"
import { ProblemsScreen } from "../problems/ProblemsScreen"
import { LibraryBooksScreen } from "../library/books/LibraryBooksScreen"
import { LibraryCollectionScreen } from "../library/shelves/LibraryCollectionScreen"
import { LibraryTagsScreen } from "../library/tags/LibraryTagsScreen"
import { memo, useEffect, useRef } from "react"
import { SearchScreenExpanded } from "../search/SearchScreenExpanded"
import { useSignalValue } from "reactjrx"
import { authStateSignal } from "../auth/authState"
import { DataSourcesTabNavigator } from "../dataSources/DataSourcesTabNavigator"
import { DataSourcesReportsScreen } from "../dataSources/reports/DataSourcesReportsScreen"
import { CollectionActionsDrawer } from "../collections/CollectionActionsDrawer/CollectionActionsDrawer"
import { SecurityScreen } from "../settings/SecurityScreen"
import { PluginsScreen } from "../plugins/PluginsScreen"
import { PluginScreen } from "../plugins/PluginScreen"

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
  const isAuthenticated = !!auth?.token

  return (
    <BrowserRouter>
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
              <Route path={`${ROUTES.SECURITY}`} element={<SecurityScreen />} />
              <Route path={`${ROUTES.SETTINGS}`} element={<SettingsScreen />} />
              <Route
                path={`${ROUTES.STATISTICS}`}
                element={<StatisticsScreen />}
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
                    element={<Navigate to={ROUTES.DATASOURCES_LIST} replace />}
                  />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </>
          ) : (
            <>
              <Route path={ROUTES.LOGIN} element={<LoginScreen />} />
              <Route
                path="*"
                element={
                  <Navigate
                    to={{
                      pathname: ROUTES.LOGIN,
                    }}
                    replace
                  />
                }
              />
            </>
          )}
        </Routes>
      </div>
      <BookActionsDrawer />
      <CollectionActionsDrawer />
      <BackToReadingDialog isProfileHydrated={isProfileHydrated} />
      <TrackHistoryCanGoBack />
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
    if (!isFirstChange.current && !(state || {})?.__obokuFallbackBack) {
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
