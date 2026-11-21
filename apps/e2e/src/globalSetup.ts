import {
  adminCreateServerSource,
  adminListServerSources,
  adminSetWebDavCredentials,
  adminUpdateServerSync,
} from "@oboku/shared"
import { signInAsAdmin } from "./admin"
import { SERVER_LIBRARY } from "./stack"

/**
 * Serves the books in fixtures/books through Server Sync. The instance config
 * is shared by every test, so it is written once, before the workers start.
 */
export default async function enableServerLibrary() {
  const client = await signInAsAdmin()

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
