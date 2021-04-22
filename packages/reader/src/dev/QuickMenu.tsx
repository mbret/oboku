import React from 'react'
import { useRecoilValue } from 'recoil'
import { Scrubber } from './Scrubber'
import { bookTitleState, isComicState, manifestState, paginationState } from './state'

export const QuickMenu = ({ open, onPageChange, onReadingItemChange }: {
  open: boolean,
  onPageChange: (index: number) => void,
  onReadingItemChange: (index: number) => void,
}) => {
  const bookTitle = useRecoilValue(bookTitleState)
  const manifest = useRecoilValue(manifestState)
  const pagination = useRecoilValue(paginationState)
  const pageIndex = (pagination?.begin.pageIndexInChapter || 0) + 1
  const isComic = useRecoilValue(isComicState)
  const currentSpineItemIndex = pagination?.begin.spineItemIndex || 0

  const buildTitleChain = (chapterInfo: NonNullable<typeof pagination>['begin']['chapterInfo']): string => {
    if (chapterInfo?.subChapter) {
      return `${chapterInfo.title} / ${buildTitleChain(chapterInfo.subChapter)}`
    }
    return chapterInfo?.title || ''
  }

  return (
    <>
      {open && (
        <div style={{
          position: `absolute`,
          left: 0,
          top: 0,
          width: `100%`,
          height: 70,
          backgroundColor: 'chocolate',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            color: 'white'
          }}>
            {bookTitle}
          </div>
        </div>
      )}
      {open && (
        <div style={{
          position: `absolute`,
          left: 0,
          bottom: 0,
          width: `100%`,
          height: 100,
          backgroundColor: 'chocolate',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            paddingLeft: 10
          }}>
            {manifest?.readingDirection === 'ltr' && currentSpineItemIndex > 0 && (
              <button onClick={_ => onReadingItemChange(currentSpineItemIndex - 1)}>{`<<`}</button>
            )}
            {manifest?.readingDirection !== 'ltr' && (pagination?.begin.spineItemIndex || 0) < (pagination?.numberOfSpineItems || 0) - 1 && (
              <button onClick={_ => onReadingItemChange(currentSpineItemIndex + 1)}>{`<<`}</button>
            )}
          </div>
          <div style={{
            width: `100%`,
            paddingLeft: 20,
            paddingRight: 20,
          }}>
            <div style={{
              color: 'white'
            }}>
              {`Progression: ${(pagination?.percentageEstimateOfBook || 0) * 100}%`}
            </div>
            <div style={{
              color: 'white'
            }}>
              {`Chapter ${buildTitleChain(pagination?.begin.chapterInfo)}`}
            </div>
            {!isComic && (
              <div style={{
                color: 'white'
              }}>
                {`page ${pageIndex} of ${pagination?.begin.numberOfPagesInChapter}`}
              </div>
            )}
            {isComic && (
              <div style={{
                color: 'white'
              }}>
                {`page ${(pagination?.begin.spineItemIndex || 0) + 1} of ${pagination?.numberOfSpineItems}`}
              </div>
            )}
            <Scrubber onPageChange={onPageChange} />
          </div>
          <div style={{
            paddingRight: 10
          }}>
            {manifest?.readingDirection === 'ltr' && (pagination?.begin.spineItemIndex || 0) < (pagination?.numberOfSpineItems || 0) - 1 && (
              <button onClick={_ => onReadingItemChange(currentSpineItemIndex + 1)}>{`>>`}</button>
            )}
            {manifest?.readingDirection !== 'ltr' && currentSpineItemIndex > 0 && (
              <button onClick={_ => onReadingItemChange(currentSpineItemIndex - 1)}>{`>>`}</button>
            )}
          </div>
        </div>
      )}
    </>
  )
}