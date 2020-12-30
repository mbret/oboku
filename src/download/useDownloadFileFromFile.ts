import localforage from 'localforage'
import { useCallback } from 'react'
import { useRecoilCallback } from 'recoil'
import { DOWNLOAD_PREFIX } from '../constants'
import { DownloadState, normalizedBookDownloadsState } from './states'

export const useDownloadFileFromFile = () => {
  return useRecoilCallback(({ set }) => async ({ id, file }: { id: string, file: File }) => {
    set(normalizedBookDownloadsState, prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        downloadProgress: 100,
        downloadState: DownloadState.Downloaded,
      }
    }))
    await localforage.setItem(`${DOWNLOAD_PREFIX}-${id}`, file)
  }, [])
}