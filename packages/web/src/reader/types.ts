import { Book } from "epubjs"

// type Locations = Book['locations']
// type Locationss = typeof Locations

// export class FixedLocations extends (typeof Locations) {

// }
export {}

export type PackagingMetadataObjectWithMissingProperties = Book['packaging']['metadata'] & {
  direction: string
}

export type RenditionOptions = Parameters<Book['renderTo']>[1]
