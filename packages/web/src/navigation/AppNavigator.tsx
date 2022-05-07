import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation
} from "react-router-dom"
import { HomeScreen } from "../home/HomeScreen"
import { LoginScreen } from "../auth/LoginScreen"
import { ReaderScreen } from "../reader/ReaderScreen"
import { BottomTabBar } from "../BottomTabBar"
import { ProfileScreen } from "../settings/ProfileScreen"
import { ManageStorageScreen } from "../settings/ManageStorageScreen"
import { LibraryTopTabNavigator } from "../library/LibraryTopTabNavigator"
import { ROUTES } from "../constants"
import { BookDetailsScreen } from "../books/details/BookDetailsScreen"
import { CollectionDetailsScreen } from "../collections/CollectionDetailsScreen"
import { RegisterScreen } from "../auth/RegisterScreen"
import { BookActionsDrawer } from "../books/BookActionsDrawer"
import { SyncSourcesScreen } from "../dataSources/SyncSourcesScreen"
import { SearchScreen } from "../search/SearchScreen"
import { AuthCallbackScreen } from "../auth/AuthCallbackScreen"
import { SettingsScreen } from "../settings/SettingsScreen"
import { StatisticsScreen } from "../settings/StatisticsScreen"
import { useRecoilValue } from "recoil"
import { authState } from "../auth/authState"
import { BackToReadingDialog } from "../reading/BackToReadingDialog"
import { CollectionActionsDrawer } from "../collections/CollectionActionsDrawer"
import { ProblemsScreen } from "../problems/ProblemsScreen"
import { LibraryBooksScreen } from "../library/LibraryBooksScreen"
import { LibraryCollectionScreen } from "../library/LibraryCollectionScreen"
import { LibraryTagsScreen } from "../library/LibraryTagsScreen"
import { useEffect, useRef } from "react"

const BottomTabBarRouteWrapper = () => (
  <BottomTabBar>
    <Outlet />
  </BottomTabBar>
)

export const AppNavigator = () => {
  const auth = useRecoilValue(authState)
  const isAuthenticated = !!auth?.token

  return (
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <div
        style={{
          flexShrink: 0,
          height: "100%",
          flex: 1,
          flexDirection: "column",
          display: "flex"
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
              <Route path={ROUTES.SEARCH} element={<SearchScreen />} />
              <Route
                path={`${ROUTES.PROFILE}/manage-storage`}
                element={<ManageStorageScreen />}
              />
              <Route path={`${ROUTES.SETTINGS}`} element={<SettingsScreen />} />
              <Route
                path={`${ROUTES.STATISTICS}`}
                element={<StatisticsScreen />}
              />
              <Route path="*" element={<BottomTabBarRouteWrapper />}>
                <Route index element={<HomeScreen />} />
                <Route path="profile" element={<ProfileScreen />} />
                <Route path="library" element={<LibraryTopTabNavigator />}>
                  <Route path="books" element={<LibraryBooksScreen />} />
                  <Route
                    path="collections"
                    element={<LibraryCollectionScreen />}
                  />
                  <Route path="tags" element={<LibraryTagsScreen />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
                <Route path="datasources" element={<SyncSourcesScreen />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </>
          ) : (
            <>
              <Route path={ROUTES.LOGIN} element={<LoginScreen />} />
              <Route path={ROUTES.REGISTER} element={<RegisterScreen />} />
              <Route
                path="*"
                element={
                  <Navigate
                    to={{
                      pathname: ROUTES.LOGIN
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
      <BackToReadingDialog />
      <TrackHistoryCanGoBack />
    </BrowserRouter>
  )
}

const TrackHistoryCanGoBack = () => {
  const { pathname } = useLocation()
  const isFirstChange = useRef(true)

  useEffect(() => {
    if (!isFirstChange.current) {
      window.history.replaceState(
        {
          ...window.history.state,
          __obokuCanGoBack: true
        },
        ``
      )
    }
    isFirstChange.current = false
  }, [pathname])

  return null
}
