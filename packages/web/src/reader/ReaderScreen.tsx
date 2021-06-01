import { useState, FC, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { AppTourReader } from '../firstTimeExperience/AppTourReader';
import { useResetStateOnUnMount } from './states';
import { ReaderContext } from './ReaderProvider';
import { useWakeLock } from '../common/useWakeLock';
import { useFullScreenSwitch } from './fullScreen';
import { Reader } from './Reader';
import { Reader as ReaderInstance } from '@oboku/reader';
import { ContentsDialog } from './ContentsDialog';
import { useTrackBookBeingRead } from './BackToReading';

export const ReaderScreen: FC<{}> = () => {
  const [reader, setReader] = useState<ReaderInstance | undefined>(undefined)
  const { bookId } = useParams<{ bookId?: string }>()
  useTrackBookBeingRead(bookId)

  useWakeLock()
  useResetStateOnUnMount()
  useFullScreenSwitch()

  const onReader = useCallback((reader: ReaderInstance) => {
    setReader(reader)
    // @ts-ignore
    window.reader = reader
  }, [setReader])

  return (
    <ReaderContext.Provider value={reader}>
      {bookId && <Reader bookId={bookId} onReader={onReader} />}
      <AppTourReader />
      <ContentsDialog />
    </ReaderContext.Provider>
  )
}