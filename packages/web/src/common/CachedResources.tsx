/**
 * Standalone module that provide conveniant and flexible way to retrieve and cache assets.
 * It supports:
 * - download retry
 * - general failure retry after timeout
 * - support both blob and base64 for older browsers
 * - parallel download of different quality of same assets and display of lower res while higher res get available
 */
import { FC, memo, ReactNode, useEffect, useMemo, useState } from "react"
import {
  atom,
  selectorFamily,
  useRecoilCallback,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState
} from "recoil"
import localforage from "localforage"

const MAX_RETRY_TIME = 2
const RETRY_RETRIEVING_ASSET_AFTER = 60000 * 2 // 2 minute

type Base64 = string
type FileType = Blob | Base64

type Asset = {
  id: string
  value: Blob | undefined
  // used to invalidate the result from storage and refetch it
  cacheBuster: number
  resources: string[]
  downloading: boolean
  state: undefined | "missing" | "downloaded" | "failed"
  missingHigherOrder: boolean
}

const assetsState = atom<Asset[]>({
  key: "assetsState",
  default: []
})

const assetState = selectorFamily({
  key: "assetState",
  get:
    (id: string) =>
    ({ get }) =>
      get(assetsState).find((asset) => asset.id === id)
})

const fileToBase64 = (file: Blob) =>
  new Promise((resolve, reject) => {
    try {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.addEventListener("load", () => {
        resolve(reader.result)
      })
      reader.addEventListener("error", (error) => {
        reject(error)
      })
    } catch (e) {
      reject(e)
    }
  })

const retryFetch = async (resource: string, retryNumber = 0): Promise<Blob> => {
  if (retryNumber === MAX_RETRY_TIME) {
    throw new Error("Unable to fetch")
  }

  try {
    const response = await fetch(resource)
    if (response.status === 200) {
      return await response.blob()
    }
    throw new Error("Unable to fetch")
  } catch (e) {
    return await new Promise<Blob>((resolve, reject) => {
      setTimeout(() => {
        retryFetch(resource, retryNumber + 1)
          .then(resolve)
          .catch(reject)
      }, 500)
    })
  }
}

const useStorageAssetFromStorage = (id: string) => {
  const {
    cacheBuster,
    id: existingId,
    state
  } = useRecoilValue(assetState(id)) || {}
  const [data, setData] = useState<Blob | undefined>()
  const setAssetsState = useSetRecoilState(assetsState)

  /**
   * When download/storage fails for some reason we will wait a littbe bit
   * and reset the state so that we restart the whole process
   */
  // useEffect(() => {
  //   let timer: ReturnType<typeof setTimeout>

  //   if (state === 'failed') {
  //     timer = setTimeout(() => {
  //       setAssetsState(old => {
  //         const item = old.find((old => old.id === existingId))

  //         if (!item || item.state !== 'failed') return old

  //         return old.map(item => item.id === existingId ? { ...item, state: undefined, } : item)
  //       })
  //     }, RETRY_RETRIEVING_ASSET_AFTER)
  //   }

  //   return () => {
  //     clearTimeout(timer)
  //   }
  // }, [state, setAssetsState, existingId])

  // useEffect(() => {
  //   let cancelled = false

  //   if (!existingId || state === 'missing' || state === 'failed') return

  //     ; (async () => {
  //       let data = await localforage.getItem<({ blob: FileType, order: number }) | null>(existingId)

  //       if (data && !cancelled) {
  //         let blobData: Blob | undefined
  //         if (typeof data.blob === 'string') {
  //           const response = await fetch(data.blob)
  //           blobData = await response.blob()
  //         } else {
  //           blobData = data.blob
  //         }

  //         if (!cancelled) {
  //           setData(blobData)
  //           if (state !== 'downloaded') {
  //             setAssetsState(old => old.map(item => item.id === existingId
  //               ? {
  //                 ...item,
  //                 state: 'downloaded',
  //                 missingHigherOrder: (data?.order || 0) < (item.resources.length - 1),
  //               }
  //               : item
  //             ))
  //           }
  //         }
  //       }

  //       if (!data && !cancelled) {
  //         // console.log(`debug useStorageAssetFromStorage. item missing`)
  //         setAssetsState(old => old.map(item => item.id === existingId && item.state !== 'failed' ? { ...item, state: 'missing' } : item))
  //       }
  //     })()

  //   return () => {
  //     cancelled = true
  //   }
  // }, [cacheBuster, existingId, state, setAssetsState])

  useEffect(() => {
    setData(undefined)
  }, [id])

  return data
}

export const useLazyCachedAsset = () => {
  const [id, setId] = useState<string | undefined>(undefined)
  const [resources, setResources] = useState<string[] | undefined>(undefined)
  const { id: existingAssetId } = useRecoilValue(assetState(id || "-1")) || {}
  const setAssetsState = useSetRecoilState(assetsState)
  // const data = useStorageAssetFromStorage(id || '-1')
  const data = undefined

  useEffect(() => {
    if (!id || !resources) return
    // console.log(`debug useLazyCachedAsset`, { resources, existingAssetId })
    setAssetsState((old) => {
      if (!old.find((old) => old.id === id)) {
        return [
          ...old,
          {
            id,
            cacheBuster: 0,
            state: undefined,
            value: undefined,
            resources,
            downloading: false,
            missingHigherOrder: false
          }
        ]
      }
      return old.map((item) => (item.id === id ? { ...item, resources } : item))
    })
  }, [setAssetsState, id, resources])

  return useMemo(
    () => ({
      cachedAsset: data,
      getLazyCachedAsset: (id: string, resources: string[]) => {
        setId(id)
        setResources((old) => {
          if (resources.length === 0 && old?.length === 0) return old
          if (resources.length !== old?.length) return resources
          if (resources.length === old?.length) {
            for (let i = 0; i < resources.length; i++) {
              if (resources[i] !== old[i]) {
                return resources
              }
            }
          }
          return old
        })
      }
    }),
    [data]
  )
}

const useLazyDownloadAsset = () => {
  return useRecoilCallback(({ snapshot, set }) => async (asset: Asset) => {
    // console.log(`debug CachedResourcesProvider fetch resources`, asset)
    let startFromIndexOrder = 0
    try {
      if (asset.missingHigherOrder) {
        let data = await localforage.getItem<{
          blob: Blob
          order: number
        } | null>(asset.id)
        if (typeof data?.order === "number") {
          startFromIndexOrder = data.order + 1
        }
      }

      await Promise.all(
        asset.resources.map(async (resource, indexOrder) => {
          if (indexOrder < startFromIndexOrder) return
          const blob = await retryFetch(resource)
          const data = { blob: blob, order: indexOrder }
          const existingData = await localforage.getItem<{
            blob: FileType
            order: number
          }>(asset.id)
          if (data.order >= (existingData?.order || 0)) {
            try {
              await localforage.setItem(asset.id, data)
            } catch (e) {
              // for some browser or safari, blob is not always supported so we try to store as b64
              if (
                (e as any)?.name === "DataCloneError" &&
                (e as any)?.code === 25
              ) {
                const base64CompatibleData = {
                  blob: await fileToBase64(blob),
                  order: indexOrder
                }
                await localforage.setItem(asset.id, base64CompatibleData)
              } else {
                throw e
              }
            }
            set(assetsState, (old) =>
              old.map((item) =>
                item.id === asset.id
                  ? {
                      ...item,
                      state: "downloaded" as const,
                      downloading: false,
                      cacheBuster: item.cacheBuster + 1
                    }
                  : item
              )
            )
          }
        })
      )
    } catch (e) {
      set(assetsState, (old) =>
        old.map((item) =>
          item.id === asset.id
            ? {
                ...item,
                downloading: false,
                state: "failed" as const
              }
            : item
        )
      )
      console.error(e)
    }
  })
}

export const CachedResourcesProvider: FC<{ children: ReactNode }> = memo(
  ({ children }) => {
    const [assets, setAssets] = useRecoilState(assetsState)
    const lazyDownloadAsset = useLazyDownloadAsset()

    // console.log(`debug CachedResourcesProvider`, { assets })

    /**
     * Prepare assets to download
     */
    useEffect(() => {
      const assetsToDownload = assets.filter(
        (asset) =>
          (asset.state === "missing" || asset.missingHigherOrder) &&
          !asset.downloading &&
          asset.state !== "failed"
      )

      if (assetsToDownload.length === 0) return

      setAssets((old) =>
        old.map((old) => {
          const found = assetsToDownload.find(({ id }) => id === old.id)

          if (!found) return old

          return { ...old, downloading: true }
        })
      )

      assetsToDownload.map(lazyDownloadAsset)
    }, [assets, setAssets, lazyDownloadAsset])

    return <>{children}</>
  }
)
