import { SIGNAL_RESET } from "reactjrx"
import { afterEach, describe, expect, it, vi } from "vitest"
import { openTestDatabase } from "../databases.fixture"
import {
  awaitDocumentsPushed,
  DOCUMENTS_PUSH_TIMEOUT_MS,
} from "./awaitDocumentsPushed"
import { type ReplicationState, runningReplicationsSignal } from "./states"

const runReplication = (
  collectionName: string,
  awaitDocumentPushed: ReplicationState["awaitDocumentPushed"],
) => {
  // test double: the helper only asks a replication whether a document was pushed
  const replication = { awaitDocumentPushed } as unknown as ReplicationState

  runningReplicationsSignal.update(new Map([[collectionName, replication]]))
}

const runPendingPromiseCallbacks = () =>
  new Promise((resolve) => setTimeout(resolve))

const openSettingsDocument = async () => {
  const database = await openTestDatabase()
  const settings = await database.settings.findOne("settings").exec()

  if (!settings) throw new Error("The database has no settings")

  return settings
}

describe("awaitDocumentsPushed", () => {
  afterEach(() => {
    runningReplicationsSignal.update(SIGNAL_RESET)
    vi.useRealTimers()
  })

  it("resolves once the replication of the document's collection pushed it", async () => {
    const settings = await openSettingsDocument()
    const { promise: pushed, resolve: completePush } =
      Promise.withResolvers<void>()
    const awaitDocumentPushed = vi.fn(() => pushed)
    runReplication("settings", awaitDocumentPushed)
    const onPushed = vi.fn()

    const waiting = awaitDocumentsPushed([settings]).then(onPushed)

    await runPendingPromiseCallbacks()

    expect(awaitDocumentPushed).toHaveBeenCalledWith(settings)
    expect(onPushed).not.toHaveBeenCalled()

    completePush()
    await waiting

    expect(onPushed).toHaveBeenCalled()
  })

  it("fails when the document is not pushed in time", async () => {
    const settings = await openSettingsDocument()
    vi.useFakeTimers()
    runReplication("settings", () => new Promise<void>(() => {}))
    const onFailed = vi.fn()

    awaitDocumentsPushed([settings]).catch(onFailed)

    await vi.advanceTimersByTimeAsync(DOCUMENTS_PUSH_TIMEOUT_MS - 1)

    expect(onFailed).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)

    expect(onFailed).toHaveBeenCalled()
  })

  it("fails when no replication of the document's collection runs", async () => {
    const settings = await openSettingsDocument()
    const awaitSecretPushed = vi.fn(async () => {})
    runReplication("secret", awaitSecretPushed)

    await expect(awaitDocumentsPushed([settings])).rejects.toThrow(
      "No replication of the settings collection runs",
    )
    expect(awaitSecretPushed).not.toHaveBeenCalled()
  })
})
