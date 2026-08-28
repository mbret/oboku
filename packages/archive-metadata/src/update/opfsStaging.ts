import { report } from "../utils/report"
import type { OpenStagingScope, OpenZipTarget, StageBytes } from "./staging"

const STAGING_DIR = "prose-reader-archive-staging-v1"

const lockNameFor = (updateId: string) => `${STAGING_DIR}:${updateId}`

type HeldLock = { release: () => void }

/**
 * Takes a lock and keeps it, resolving once it is held. A Web Lock lasts exactly
 * as long as its callback's promise stays pending and is dropped automatically
 * when the holding context dies — that automatic drop is the only signal that
 * tells the reaper a staging directory has been orphaned rather than being in
 * active use by another tab.
 */
const holdLock = (name: string): Promise<HeldLock> =>
  new Promise<HeldLock>((granted, failedToGrant) => {
    navigator.locks
      .request(name, function holdUntilReleased() {
        return new Promise<void>((released) => {
          granted({
            release: function releaseHeldLock() {
              released()
            },
          })
        })
      })
      .catch(failedToGrant)
  })

const openScopeDir = async (updateId: string) => {
  const root = await navigator.storage.getDirectory()
  const staging = await root.getDirectoryHandle(STAGING_DIR, { create: true })

  return {
    staging,
    dir: await staging.getDirectoryHandle(updateId, { create: true }),
  }
}

const createStagedFile = (
  dir: FileSystemDirectoryHandle,
  extension: string,
): Promise<FileSystemFileHandle> =>
  dir.getFileHandle(`${crypto.randomUUID()}.${extension}`, { create: true })

/**
 * Spills entry bytes to OPFS so the pipeline carries a file-backed blob rather
 * than the bytes themselves.
 */
const stageBytesIn = (dir: FileSystemDirectoryHandle): StageBytes =>
  async function stageBytesInScope(bytes) {
    const handle = await createStagedFile(dir, "bin")
    const stream = await handle.createWritable()

    await stream.write(bytes)
    await stream.close()

    return handle.getFile()
  }

const openZipTargetIn = (dir: FileSystemDirectoryHandle): OpenZipTarget =>
  async function openZipTargetInScope() {
    const handle = await createStagedFile(dir, "zip")

    return {
      stream: await handle.createWritable(),
      finish: () => handle.getFile(),
      dispose: () => dir.removeEntry(handle.name).catch(() => {}),
    }
  }

const removeScopeUnlessOwned = async (
  staging: FileSystemDirectoryHandle,
  updateId: string,
): Promise<void> => {
  await navigator.locks.request(
    lockNameFor(updateId),
    { ifAvailable: true, mode: "exclusive" },
    async function removeOnlyWhenNoUpdateHoldsIt(lock) {
      if (!lock) return

      await staging.removeEntry(updateId, { recursive: true }).catch(() => {})

      report.info("reaped orphaned staged files", { updateId })
    },
  )
}

/**
 * Drops staged files left behind by contexts that died mid-update. Directories
 * whose lock is still held belong to an update that is running right now,
 * possibly in another tab, and are left alone — acquiring the lock rather than
 * querying it is what makes that check free of a time-of-check race.
 */
export const purgeStagedFiles = async (): Promise<void> => {
  try {
    const root = await navigator.storage.getDirectory()

    const staging = await root.getDirectoryHandle(STAGING_DIR).catch(() => null)

    if (!staging) return

    for await (const updateId of staging.keys()) {
      await removeScopeUnlessOwned(staging, updateId)
    }
  } catch (error) {
    report.warn("unable to purge staged files", error)
  }
}

/**
 * Gives the update its own staging directory, held under a Web Lock for as long
 * as the scope lives. Both are per-update rather than per-context so that two
 * updates running side by side cannot clean up each other's files.
 *
 * Opening a scope is also when orphans from earlier contexts are reaped: the lock
 * is already held by then, so the sweep cannot reach this update's own directory.
 */
export const openOpfsStagingScope: OpenStagingScope = async () => {
  const updateId = crypto.randomUUID()
  const lock = await holdLock(lockNameFor(updateId))

  try {
    const { staging, dir } = await openScopeDir(updateId)

    void purgeStagedFiles()

    return {
      stageBytes: stageBytesIn(dir),
      openZipTarget: openZipTargetIn(dir),
      release: async function releaseScope() {
        await staging.removeEntry(updateId, { recursive: true }).catch(() => {})
        lock.release()
      },
    }
  } catch (error) {
    lock.release()

    throw error
  }
}
