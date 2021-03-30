import './debug'
import React from 'react';
import ReactDOM from 'react-dom';
import 'fontsource-roboto/300.css'
import 'fontsource-roboto/400.css'
import 'fontsource-roboto/500.css'
import 'fontsource-roboto/700.css'
import 'react-responsive-carousel/lib/styles/carousel.min.css'
import './index.css';
import { configureDataSources } from './dataSources/configure';
import { App } from './App';
import reportWebVitals from './reportWebVitals'
import * as Sentry from "@sentry/react"
import { randomBytes, createHash } from 'crypto-browserify'

// @ts-ignore
window.crypto.randomBytes = randomBytes
// @ts-ignore
window.crypto.createHash = createHash

ReactDOM.render(
  <React.StrictMode>
    <Sentry.ErrorBoundary>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(console.log)

configureDataSources()