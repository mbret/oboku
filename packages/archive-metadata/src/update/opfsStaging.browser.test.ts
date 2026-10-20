import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  onTestFinished,
  vi,
} from "vitest"
import { openOpfsStagingScope, purgeStagedFiles } from "./opfsStaging"

const STAGING_DIR = "prose-reader-archive-staging-v1"

const lockNameFor = (updateId: string) => `${STAGING_DIR}:${updateId}`

const openStagingDir = async () => {
  const root = await navigator.storage.getDirectory()

  return root.getDirectoryHandle(STAGING_DIR, { create: true })
}

const listStagedUpdateIds = async () =>
  Array.fromAsync((await openStagingDir()).keys())

const listStagedFileNames = async (updateId: string) => {
  const staging = await openStagingDir()
  const updateDir = await staging.getDirectoryHandle(updateId)

  return Array.fromAsync(updateDir.keys())
}

const getOnlyStagedUpdateId = async () => {
  const [updateId, ...others] = await listStagedUpdateIds()

  if (!updateId || others.length > 0) {
    throw new Error("expected exactly one staged update")
  }

  return updateId
}

const seedOrphanedUpdates = async (updateIds: string[]) => {
  const staging = await openStagingDir()

  for (const updateId of updateIds) {
    await staging.getDirectoryHandle(updateId, { create: true })
  }
}

const listHeldStagingLockNames = async () => {
  const { held = [] } = await navigator.locks.query()

  return held
    .map((lock) => lock.name ?? "")
    .filter((name) => name.startsWith(`${STAGING_DIR}:`))
}

const openScope = async () => {
  const scope = await openOpfsStagingScope()

  onTestFinished(scope.release)

  return scope
}

const openWrittenZipTarget = async (bytes: Uint8Array) => {
  const target = await (await openScope()).openZipTarget()

  if (!target) throw new Error("OPFS staging always opens a zip target")

  const writer = target.stream.getWriter()

  await writer.write(bytes)
  await writer.close()

  return target
}

const bytesOf = async (blob: Blob) => new Uint8Array(await blob.arrayBuffer())

const disableOpfs = () => {
  vi.stubGlobal("navigator", {})
}

const stageFromWorker = async () => {
  const worker = new Worker(
    new URL("./opfsStaging.browser.test.worker.ts", import.meta.url),
    { type: "module" },
  )

  onTestFinished(function terminateWorker() {
    worker.terminate()
  })

  await new Promise<void>(function waitUntilStaged(resolve, reject) {
    worker.addEventListener("message", function resolveOnceStaged() {
      resolve()
    })
    worker.addEventListener("error", function rejectWithWorkerError(event) {
      reject(new Error(`test worker failed: ${event.message}`))
    })
  })

  return worker
}

beforeEach(async function startFromAnEmptyOriginPrivateFileSystem() {
  const root = await navigator.storage.getDirectory()

  for (const name of await Array.fromAsync(root.keys())) {
    await root.removeEntry(name, { recursive: true })
  }
})

afterEach(function restoreBrowserApis() {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("openOpfsStagingScope", () => {
  it("rejects rather than degrading when the platform has no OPFS", async () => {
    disableOpfs()

    await expect(openOpfsStagingScope()).rejects.toThrow()
  })

  it("spills the bytes into its own directory and returns the written file", async () => {
    const scope = await openScope()

    const blob = await scope.stageBytes(new Uint8Array([4, 5, 6]).buffer)

    expect(await bytesOf(blob)).toEqual(new Uint8Array([4, 5, 6]))
    expect(await listStagedFileNames(await getOnlyStagedUpdateId())).toEqual([
      expect.stringMatching(/\.bin$/),
    ])
  })

  it("gives concurrent scopes separate directories", async () => {
    const first = await openScope()
    const second = await openScope()

    await first.stageBytes(new Uint8Array([1]).buffer)
    await second.stageBytes(new Uint8Array([2]).buffer)

    expect(await listStagedUpdateIds()).toHaveLength(2)
  })

  it("releasing one scope leaves a concurrent scope's files alone", async () => {
    const first = await openScope()
    const second = await openScope()
    const survivor = await second.stageBytes(new Uint8Array([9]).buffer)

    await first.release()

    expect(await bytesOf(survivor)).toEqual(new Uint8Array([9]))
    expect(await listStagedUpdateIds()).toHaveLength(1)
  })

  it("finishes into the file its stream wrote", async () => {
    const target = await openWrittenZipTarget(new Uint8Array([1, 2, 3]))

    expect(await bytesOf(await target.finish())).toEqual(
      new Uint8Array([1, 2, 3]),
    )
  })

  it("streams into a staged file and drops it on the target's dispose", async () => {
    const target = await openWrittenZipTarget(new Uint8Array([1]))
    const updateId = await getOnlyStagedUpdateId()

    expect(await listStagedFileNames(updateId)).toEqual([
      expect.stringMatching(/\.zip$/),
    ])

    await target.dispose()

    expect(await listStagedFileNames(updateId)).toEqual([])
  })

  it("removes its directory and frees its lock on release", async () => {
    const scope = await openScope()
    const updateId = await getOnlyStagedUpdateId()

    expect(await listHeldStagingLockNames()).toEqual([lockNameFor(updateId)])

    await scope.release()

    expect(await listStagedUpdateIds()).toEqual([])
    expect(await listHeldStagingLockNames()).toEqual([])
  })

  it("reaps orphans left by earlier contexts without being asked", async () => {
    await seedOrphanedUpdates(["dead"])

    await openScope()

    await vi.waitFor(async function waitForTheOrphanToBeReaped() {
      expect(await listStagedUpdateIds()).not.toContain("dead")
    })
    expect(await listStagedUpdateIds()).toHaveLength(1)
  })

  it("frees its lock and propagates when the directory cannot be created", async () => {
    vi.spyOn(
      FileSystemDirectoryHandle.prototype,
      "getDirectoryHandle",
    ).mockRejectedValue(new Error("quota exceeded"))

    await expect(openOpfsStagingScope()).rejects.toThrow("quota exceeded")
    expect(await listHeldStagingLockNames()).toEqual([])
  })

  it("propagates a failed spill rather than keeping the bytes in memory", async () => {
    const scope = await openScope()
    vi.spyOn(
      FileSystemDirectoryHandle.prototype,
      "getFileHandle",
    ).mockRejectedValue(new Error("quota exceeded"))

    await expect(scope.stageBytes(new Uint8Array([7]).buffer)).rejects.toThrow(
      "quota exceeded",
    )
  })
})

describe("purgeStagedFiles", () => {
  it("removes directories no update holds", async () => {
    await seedOrphanedUpdates(["dead-a", "dead-b"])

    await purgeStagedFiles()

    expect(await listStagedUpdateIds()).toEqual([])
  })

  it("leaves a live scope's directory alone", async () => {
    const live = await openScope()
    const staged = await live.stageBytes(new Uint8Array([3]).buffer)
    const liveUpdateId = await getOnlyStagedUpdateId()
    await seedOrphanedUpdates(["dead"])

    await purgeStagedFiles()

    expect(await listStagedUpdateIds()).toEqual([liveUpdateId])
    expect(await bytesOf(staged)).toEqual(new Uint8Array([3]))
  })

  it("reaps a directory once its scope is released", async () => {
    const scope = await openScope()
    await scope.stageBytes(new Uint8Array([3]).buffer)
    const updateId = await getOnlyStagedUpdateId()

    await purgeStagedFiles()
    expect(await listStagedUpdateIds()).toEqual([updateId])

    await scope.release()
    await purgeStagedFiles()

    expect(await listStagedUpdateIds()).toEqual([])
  })

  it("reaps the files of an update whose context died mid-update", async () => {
    const worker = await stageFromWorker()

    await purgeStagedFiles()

    expect(await listStagedUpdateIds()).toHaveLength(1)

    worker.terminate()

    await vi.waitFor(async function waitForTheDeadUpdateToBeReaped() {
      await purgeStagedFiles()

      expect(await listStagedUpdateIds()).toEqual([])
    })
  })

  it("stays best-effort when OPFS is unavailable", async () => {
    disableOpfs()

    await expect(purgeStagedFiles()).resolves.toBeUndefined()
  })

  it("swallows errors when there is nothing to purge", async () => {
    await expect(purgeStagedFiles()).resolves.toBeUndefined()
  })
})
