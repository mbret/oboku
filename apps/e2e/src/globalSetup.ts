import {
  type ApiClient,
  adminCreateServerSource,
  adminListServerSources,
  adminSetWebDavCredentials,
  adminUpdateServerSync,
  adminUpdateSettings,
} from "@oboku/shared"
import { signInAsAdmin } from "./admin"
import { SERVER_LIBRARY } from "./stack"

export default async function configureStack() {
  const client = await signInAsAdmin()

  await enableServerLibrary(client)
  await offerCloudProviders(client)
}

/**
 * The app offers Google Drive and OneDrive, as the hosted app does. The stack
 * cannot reach them, so their ids are placeholders and signing in fails.
 */
async function offerCloudProviders(client: ApiClient) {
  await adminUpdateSettings({
    client,
    body: {
      googleClientId: "e2e-placeholder.apps.googleusercontent.com",
      googleApiKey: "e2e-placeholder",
      microsoftApplicationClientId: "e2e-placeholder",
    },
  })
}

/** Serves the books in fixtures/books through Server Sync. */
async function enableServerLibrary(client: ApiClient) {
  await adminUpdateServerSync({ client, body: { enabled: true } })
  await adminSetWebDavCredentials({
    client,
    body: {
      username: SERVER_LIBRARY.username,
      password: SERVER_LIBRARY.password,
    },
  })

  const { data: sources } = await adminListServerSources({ client })
  const isLibrarySourceCreated = sources.some(
    (source) => source.path === SERVER_LIBRARY.path,
  )

  if (!isLibrarySourceCreated) {
    await adminCreateServerSource({
      client,
      body: { name: SERVER_LIBRARY.name, path: SERVER_LIBRARY.path },
    })
  }
}
