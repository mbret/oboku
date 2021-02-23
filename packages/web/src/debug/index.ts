import { useEffect, useState } from "react"
// import * as Sentry from "@sentry/react";
// import { Integrations } from "@sentry/tracing";
import firebase from "firebase/app"
import "firebase/analytics"
import { FIREBASE_BASE_CONFIG } from '../constants'
// import { version } from '../../package.json'
import localforage from 'localforage'

// @ts-ignore
window.localforage = localforage

export const isDebugEnabled = () => {
  return localStorage.getItem('oboku_debug_enabled') === 'true'
}

if (process.env.NODE_ENV !== 'development') {
  // Sentry.init({
  //   dsn: "https://0d7a61df8dba4122be660fcc1161bf49@o490447.ingest.sentry.io/5554285",
  //   autoSessionTracking: true,
  //   integrations: [
  //     new Integrations.BrowserTracing(),
  //   ],
  //   beforeSend(event) {
  //     if (event?.extra?.feedback) {
  //       Sentry.showReportDialog({
  //         labelSubmit: 'Submit feedback',
  //         title: 'Want to report a bug or give us a sugestion?',
  //         subtitle: 'Your feedback is very valuable. Do not hesitate to abuse this form!',
  //         subtitle2: '',
  //         user: {
  //           email: (event?.extra?.email as string | undefined),
  //           name: (event?.extra?.name as string | undefined),
  //         }
  //       })
  //     }
  
  //     return event
  //   },
  //   // We recommend adjusting this value in production, or using tracesSampler
  //   // for finer control
  //   tracesSampleRate: 1.0,
  // })
  // Sentry.setTag('npm_version', version)

  firebase.initializeApp(FIREBASE_BASE_CONFIG)
  firebase.analytics()

  if (!isDebugEnabled()) {
    console.log = () => { }
    console.error = () => { }
    console.warn = () => { }
  }
} else {
  console.log(process.env)
}

type DebugEvent = CustomEvent<boolean>

export const enableDebug = () => {
  localStorage.setItem('oboku_debug_enabled', 'true')
  document.dispatchEvent(new CustomEvent('oboku_debug_change', {
    detail: true
  }))
}

export const disableDebug = () => {
  localStorage.setItem('oboku_debug_enabled', 'false')
  document.dispatchEvent(new CustomEvent('oboku_debug_change', {
    detail: false
  }))
}

export const toggleDebug = () => {
  if (isDebugEnabled()) {
    disableDebug()
  } else {
    enableDebug()
  }
}

export const useIsDebugEnabled = () => {
  const [isEnabled, setIsEnabled] = useState(isDebugEnabled())

  useEffect(() => {
    const listener = ((event: DebugEvent) => {
      setIsEnabled(event.detail)
    }) as EventListener

    document.addEventListener('oboku_debug_change', listener)

    return () => {
      document.removeEventListener('oboku_debug_change', listener)
    }
  }, [])

  return isEnabled
}