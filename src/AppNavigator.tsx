import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import './App.css';
import { HomeScreen } from './HomeScreen';
import { Reader } from './Reader';
import { BottomTabBar } from './BottomTabBar';
import { SettingsScreen } from './settings/SettingsScreen';
import { ManageStorageScreen } from './settings/ManageStorageScreen';
import { LibraryTopTabNavigator } from './library/LibraryTopTabNavigator';
import { ROUTES } from './constants';
import { BookDetailsScreen } from './books/BookDetailsScreen';
import { SeriesDetailsScreen } from './series/SeriesDetailsScreen';

export const AppNavigator = () => {
  return (
    <Router>
      <div style={{
        height: '100%',
        display: 'flex',
        flexFlow: 'column'
      }}>
        <Switch>
          <Route path="/reader/:bookId" >
            <Reader />
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
              <Route path="/">
                <Redirect to="/" />
              </Route>
            </Switch>
          </BottomTabBar>
        </Switch>
      </div>
    </Router>
  );
}
