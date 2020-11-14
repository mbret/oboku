import React from 'react'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom"
import './App.css'
import { HomeScreen } from './HomeScreen'
import { LoginScreen } from './auth/LoginScreen'
import { ReaderScreen } from './reader/ReaderScreen'
import { BottomTabBar } from './BottomTabBar'
import { SettingsScreen } from './settings/SettingsScreen'
import { ManageStorageScreen } from './settings/ManageStorageScreen'
import { LibraryTopTabNavigator } from './library/LibraryTopTabNavigator'
import { ROUTES } from './constants'
import { BookDetailsScreen } from './books/BookDetailsScreen'
import { SeriesDetailsScreen } from './series/SeriesDetailsScreen'
import { useAuth } from './auth/queries'
import { RegisterScreen } from './auth/RegisterScreen'
import { BookActionsDrawer } from './books/BookActionsDrawer'
import { DataSourcesScreen } from './dataSources/DataSourcesScreen'
import { FAQScreen } from './FAQScreen'

export const AppNavigator = () => {
  const { data: authData } = useAuth()
  const isAuthenticated = !!authData?.auth.token

  return (
    <Router basename={process.env.PUBLIC_URL}>
      <div style={{
        height: '100%',
        display: 'flex',
        flexFlow: 'column'
      }}>
        {isAuthenticated
          ? (
            <Switch>
              <Route path="/reader/:bookId" >
                <ReaderScreen />
              </Route>
              <Route path="/settings/manage-storage" >
                <ManageStorageScreen />
              </Route>
              <Route exact path={ROUTES.BOOK_DETAILS} >
                <BookDetailsScreen />
              </Route>
              <Route exact path={ROUTES.SERIES_DETAILS} >
                <SeriesDetailsScreen />
              </Route>
              <Route exact path={ROUTES.FAQ}>
                <FAQScreen />
              </Route>
              <BottomTabBar>
                <Switch>
                  <Route exact path="/settings">
                    <SettingsScreen />
                  </Route>
                  <Route path="/library">
                    <LibraryTopTabNavigator />
                  </Route>
                  <Route exact path="/">
                    <HomeScreen />
                  </Route>
                  <Route exact path={ROUTES.DATASOURCES}>
                    <DataSourcesScreen />
                  </Route>
                  <Route path="/">
                    <Redirect to="/" />
                  </Route>
                </Switch>
              </BottomTabBar>
            </Switch>
          )
          : (
            <Switch>
              <Route exact path={ROUTES.LOGIN}>
                <LoginScreen />
              </Route>
              <Route exact path={ROUTES.REGISTER}>
                <RegisterScreen />
              </Route>
              <Redirect
                to={{
                  pathname: ROUTES.LOGIN,
                }}
              />
            </Switch>
          )}
      </div>
      <BookActionsDrawer />
    </Router>
  )
}
