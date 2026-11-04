// Copies oboku's CouchDB data (_users and every userdb-*) between a CouchDB
// outside the stack ("old") and the stack's couchdb service ("new").
//
// Run it through the api service, which already reaches both servers and gets
// COUCHDB_PASSWORD and the JWT key the same way the API does:
//
//   export OLD_URL=https://couch.example.org OLD_USER=admin OLD_PASSWORD=...
//   docker compose run --rm --no-deps -T -e OLD_URL -e OLD_USER -e OLD_PASSWORD \
//     api node --input-type=module - <mode> < couchdb-replicate.mjs
//
// On Cosmos, where the containers are no compose project, run it in a Node
// container on the API's network, with the API's JWT key and NEW_URL naming
// the CouchDB container:
//
//   export OLD_URL=... OLD_USER=admin OLD_PASSWORD=... COUCHDB_PASSWORD=...
//   docker run --rm -i --network <api network> -v <api secrets>:/secrets:ro \
//     -e OLD_URL -e OLD_USER -e OLD_PASSWORD -e COUCHDB_PASSWORD \
//     -e NEW_URL=http://oboku-couchdb:5984 \
//     node:24-alpine node --input-type=module - <mode> < couchdb-replicate.mjs
//
// Modes:
//   check       the new CouchDB accepts the tokens the API signs
//   old-to-new  copies everything, resuming where the previous run stopped
//   verify      compares document counts, old vs new
//   new-to-old  copies back, keeping the old server in sync
//
// CouchDB delays the start of each replication by up to 5 s by default. Set
// the delay to 0 on the new server before copying: 400 user databases then
// take about 25 s instead of 160 s, and a pass with no changes 6 s instead of
// 140 s.
//
//   docker exec oboku-couchdb curl -s -X PUT -d '"0"' \
//     http://admin:<password>@127.0.0.1:5984/_node/_local/_config/replicator/startup_jitter
//
// The new server runs every replication, so it never has to be reachable from
// outside the stack. NEW_URL must resolve the same way here and inside the
// couchdb container, which a compose service name or a container name on a
// shared network does.

import { createSign } from "node:crypto"
import { readFile } from "node:fs/promises"

const PARALLEL = Number(process.env.PARALLEL ?? 8)
// Each server keeps its own _design/_auth, which differs between versions.
const USER_DOCS_ONLY = { _id: { $regex: "^org\\.couchdb\\.user:" } }

class CouchError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

function required(name) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set`)
  return value
}

const withoutTrailingSlash = (url) => url.replace(/\/+$/, "")

const basicAuth = ({ username, password }) =>
  `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`

async function request(
  server,
  path,
  { method = "GET", body, authorization } = {},
) {
  const response = await fetch(`${server.url}${path}`, {
    method,
    headers: {
      authorization: authorization ?? basicAuth(server),
      "content-type": "application/json",
    },
    body: body && JSON.stringify(body),
  })
  const data = await response.json()

  if (!response.ok) {
    throw new CouchError(
      `${method} ${server.url}${path}: ${response.status} ${JSON.stringify(data)}`,
      response.status,
    )
  }

  return data
}

async function listUserDbs(server) {
  const dbs = await request(server, "/_all_dbs")

  return dbs.filter((db) => db.startsWith("userdb-"))
}

async function inParallel(items, task) {
  const queue = [...items]
  const results = []

  async function worker() {
    for (let item = queue.shift(); item !== undefined; item = queue.shift()) {
      results.push(await task(item))
    }
  }

  await Promise.all(Array.from({ length: PARALLEL }, worker))

  return results
}

const endpoint = (server, db) => ({
  url: `${server.url}/${db}`,
  auth: { basic: { username: server.username, password: server.password } },
})

async function replicate(servers, source, target, db, selector) {
  const result = await request(servers.new, "/_replicate", {
    method: "POST",
    body: {
      source: endpoint(source, db),
      target: endpoint(target, db),
      create_target: true,
      create_target_params: { q: 1 },
      ...(selector && { selector }),
    },
  })

  if (result.no_changes) return { db, noChanges: true, docWriteFailures: 0 }

  // Counts add up over every run of the same replication.
  const [lastSession] = result.history

  return {
    db,
    docsWritten: lastSession.docs_written,
    docWriteFailures: lastSession.doc_write_failures,
  }
}

async function copy(servers, source, target) {
  const users = await replicate(
    servers,
    source,
    target,
    "_users",
    USER_DOCS_ONLY,
  )
  console.log(JSON.stringify(users))

  const dbs = await listUserDbs(source)
  const results = await inParallel(dbs, async function replicateUserDb(db) {
    try {
      const result = await replicate(servers, source, target, db)
      console.log(JSON.stringify(result))

      return result
    } catch (error) {
      console.error(`FAILED ${db}: ${error.message}`)

      return { db, failed: true }
    }
  })

  const failures = [users, ...results].filter(
    (result) => result.failed || result.docWriteFailures > 0,
  )
  console.log(
    `${dbs.length} user databases copied, ${failures.length} with failures`,
  )

  if (failures.length > 0) process.exitCode = 1
}

async function docCounts(server, db) {
  try {
    const info = await request(server, `/${db}`)

    return `${info.doc_count} docs, ${info.doc_del_count} deleted`
  } catch (error) {
    if (error.status === 404) return "missing"

    throw error
  }
}

async function verify(servers) {
  const [oldDbs, newDbs] = await Promise.all([
    listUserDbs(servers.old),
    listUserDbs(servers.new),
  ])
  const dbs = ["_users", ...new Set([...oldDbs, ...newDbs])]

  const comparisons = await inParallel(
    dbs,
    async function compareDocCounts(db) {
      const [oldCounts, newCounts] = await Promise.all([
        docCounts(servers.old, db),
        docCounts(servers.new, db),
      ])

      return { db, oldCounts, newCounts }
    },
  )
  const mismatches = comparisons.filter(
    ({ oldCounts, newCounts }) => oldCounts !== newCounts,
  )

  for (const { db, oldCounts, newCounts } of mismatches) {
    console.log(`${db}: old ${oldCounts}, new ${newCounts}`)
  }
  console.log(
    `${dbs.length} databases compared, ${mismatches.length} mismatch(es)`,
  )

  if (mismatches.length > 0) process.exitCode = 1
}

async function readApiPrivateKey() {
  if (process.env.JWT_PRIVATE_KEY) return atob(process.env.JWT_PRIVATE_KEY)

  return readFile(
    process.env.JWT_PRIVATE_KEY_FILE ?? "/secrets/jwt_private_key.pem",
    "utf8",
  )
}

function signAdminToken(privateKey) {
  const now = Math.floor(Date.now() / 1000)
  const encode = (part) =>
    Buffer.from(JSON.stringify(part)).toString("base64url")
  const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
    name: "admin",
    sub: "admin",
    "_couchdb.roles": ["_admin"],
    iat: now,
    exp: now + 60,
  })}`
  const signature = createSign("RSA-SHA256")
    .update(unsigned)
    .sign(privateKey, "base64url")

  return `${unsigned}.${signature}`
}

async function check(servers) {
  const token = signAdminToken(await readApiPrivateKey())
  const session = await request(servers.new, "/_session", {
    authorization: `Bearer ${token}`,
  })
  const isAcceptedAsAdmin = session.userCtx.roles.includes("_admin")

  console.log(
    isAcceptedAsAdmin
      ? "OK: the new CouchDB accepts the tokens the API signs"
      : `FAILED: the new CouchDB sees ${JSON.stringify(session.userCtx)}`,
  )

  if (!isAcceptedAsAdmin) process.exitCode = 1
}

const modes = {
  check,
  "old-to-new": (servers) => copy(servers, servers.old, servers.new),
  verify,
  "new-to-old": (servers) => copy(servers, servers.new, servers.old),
}

const mode = modes[process.argv[2]]

if (!mode) {
  console.error(
    `usage: ... node --input-type=module - <${Object.keys(modes).join("|")}>`,
  )
  process.exit(1)
}

try {
  await mode({
    old: {
      url: withoutTrailingSlash(required("OLD_URL")),
      username: required("OLD_USER"),
      password: required("OLD_PASSWORD"),
    },
    new: {
      url: withoutTrailingSlash(process.env.NEW_URL ?? "http://couchdb:5984"),
      username: process.env.COUCHDB_USER ?? "admin",
      password: required("COUCHDB_PASSWORD"),
    },
  })
} catch (error) {
  console.error(`FAILED: ${error.message}`)
  process.exitCode = 1
}
