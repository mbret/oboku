import { initializeApp } from "firebase-admin/app"

let app: ReturnType<typeof initializeApp> | undefined

/**
 * We keep the app as a singleton to optimize its instanciation
 * across lambda reuse.
 *
 * Do not call it outside of a lambda to mitigate uncaught error.
 */
export const getFirebaseApp = () => {
  if (app) return app

  const firebaseConfig = JSON.parse(
    Buffer.from(process.env.FIREBASE_CONFIG ?? "", "base64").toString() ?? "{}"
  )

  /**
   * This is an admin without privileges
   */
  app = initializeApp(firebaseConfig)

  return app
}
