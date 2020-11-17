import { ApolloProvider } from '@apollo/client';
import React from 'react';
import { useClient } from './client';
import { RoutineProcess } from './RoutineProcess';
import { AppNavigator } from './AppNavigator';
import { ThemeProvider } from '@material-ui/core';
import { theme } from './theme';
import { CookiesProvider } from "react-cookie";
import { BlockingBackdrop } from './BlockingBackdrop';
import { UnlockLibraryDialog } from './auth/UnlockLibraryDialog';
import { AppTourWelcome } from './firstTimeExperience/AppTourWelcome';
import { TourProvider } from './app-tour/TourProvider';
import { ManageBookSeriesDialog } from './books/ManageBookSeriesDialog';
import { GoogleApiProvider, listFiles } from './google';

let googleAuth

const SCOPE = 'https://www.googleapis.com/auth/drive.metadata.readonly'

const signInFunction = async () => {
  googleAuth.signIn();
  updateSignStatus()

  await listFiles((window as any).gapi, '')

}

const updateSignStatus = async () => {
  var user = googleAuth.currentUser.get();
  console.log('updateSignStatus', user)
  if (user.wc == null) {
    // this.setState({
    //   name: ''
    // });
  }
  else {
    var isAuthorized = user.hasGrantedScopes(SCOPE);
    if (isAuthorized) {
      console.log('IS AUTHORIZED')
      // this.setState({
      //   name: user.Ot.Cd
      // });
      //we will put the code of the third step here
    }
  }
}

const initClient = () => {
  (window as any).gapi.client
    .init({
      // 'apiKey': "<YOUR API KEY>",
      'clientId': "325550353363-vklpik5kklrfohg1vdrkvjp1n8dopnrd.apps.googleusercontent.com",
      'scope': SCOPE,
      'discoveryDocs': ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
    }).then(() => {
      console.log('AUTHENTICATED')
      googleAuth = (window as any).gapi.auth2.getAuthInstance()
      googleAuth.isSignedIn.listen(updateSignStatus)

      signInFunction()

      //   this.setState({
      //     googleAuth: window.gapi.auth2.getAuthInstance()
      //   })
      //   this.state.googleAuth.isSignedIn.listen(this.updateSigninStatus);


      //    document.getElementById('signout-btn').addEventListener('click', this.signOutFunction);

      // });
    })
    .catch(e => {
      console.error(e)
    })
};

function App() {
  const client = useClient()

  return (
    <>
      {!client && (
        null
      )}
      {client && (
        <CookiesProvider>
          <ApolloProvider client={client}>
            <ThemeProvider theme={theme}>
              <GoogleApiProvider>
                <TourProvider>
                  <AppNavigator />
                  <AppTourWelcome />
                  <UnlockLibraryDialog />
                  <ManageBookSeriesDialog />
                  <BlockingBackdrop />
                  <RoutineProcess />
                  <div id="measure-layer" style={{
                    display: "inline-block",
                    position: "absolute",
                    visibility: "hidden",
                    zIndex: -1,
                  }} />
                </TourProvider>
              </GoogleApiProvider>
            </ThemeProvider>
          </ApolloProvider>
        </CookiesProvider>
      )}
    </>
  );
}

export default App;
