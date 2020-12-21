import { ReadingStateState } from "oboku-shared"
import { useRecoilCallback, useSetRecoilState } from "recoil"
import { libraryState, syncState } from "./states"

export const useSyncLibrary = () => {
  const setSyncState = useSetRecoilState(syncState)

  return () => setSyncState(old => ({ ...old, syncRefresh: old.syncRefresh + 1 }))
}

export const useToggleTag = () =>
  useRecoilCallback(({ set, snapshot }) => async (tagId: string) => {
    const library = await snapshot.getPromise(libraryState)
    const tagExist = library.tags.find(id => tagId === id)
    if (tagExist) {
      set(libraryState, old => ({ ...old, tags: old.tags.filter(id => id !== tagId) }))
    } else {
      set(libraryState, old => ({ ...old, tags: [...old.tags, tagId] }))
    }
  }, [])

export const getDisplayableReadingState = (readingState: ReadingStateState) => {
  switch (readingState) {
    case ReadingStateState.Finished: return 'Finished'
    case ReadingStateState.NotStarted: return 'Not started'
    case ReadingStateState.Reading: return 'Reading'
    default: return ''
  }
}