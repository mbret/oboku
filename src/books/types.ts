import { Book } from '../generated/graphql'

export type LocalBook = Book & {
  downloadProgress?: number,
  downloadState?: 'none' | 'downloaded' | 'downloading',
}