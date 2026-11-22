import {
  adminCreateServerSource,
  adminListServerSources,
  adminSetWebDavCredentials,
  adminUpdateServerSync,
} from "@oboku/shared"
import { signInAsAdmin } from "./admin"
import { SERVER_LIBRARY } from "./stack"

/** Serves the books in fixtures/books through Server Sync. */
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
