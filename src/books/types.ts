import { Book } from 'oboku-shared'

export type LocalBook = Book & {
  downloadProgress?: number,
  downloadState?: 'none' | 'downloaded' | 'downloading',
}