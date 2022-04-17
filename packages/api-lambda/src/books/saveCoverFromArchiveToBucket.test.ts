import { BookDocType, ReadingStateState } from "@oboku/shared/src"
import { saveCoverFromArchiveToBucket } from "./saveCoverFromArchiveToBucket"

// jest.mock('fs')

const book: BookDocType = {
  _id: ``,
  _rev: ``,
  collections: [],
  createdAt: 0,
  creator: ``,
  date: null,
  isAttachedToDataSource: false,
  lang: ``,
  lastMetadataUpdateError: ``,
  lastMetadataUpdatedAt: null,
  links: [],
  metadataUpdateStatus: null,
  modifiedAt: ``,
  publisher: ``,
  readingStateCurrentBookmarkLocation: ``,
  readingStateCurrentBookmarkProgressPercent: 0,
  readingStateCurrentBookmarkProgressUpdatedAt: ``,
  readingStateCurrentState: ReadingStateState.Reading,
  rights: ``,
  rx_model: `book`,
  subject: null,
  tags: [],
  title: ``
}

const MOCK_FILE_INFO = {
  '/path/to/file1.js': 'console.log("file1 contents");',
  '/path/to/file2.txt': 'file2 contents',
}

beforeEach(() => {
  // Set up some mocked out file info before each test
  // require('fs').__setMockFiles(MOCK_FILE_INFO);
})

it(`shoud`, async () => {
  const context = { userId: `userId` }
  const epubFilepath = `${__dirname}/World's end harem - Edition semi-couleur T - _Link, Kotaro Shouno.epub`
  const folderBasePath = `EPUB`
  const coverPath = `Image/cover.jpg`

  // await saveCoverFromArchiveToBucket(context, book, epubFilepath, folderBasePath, coverPath)
})