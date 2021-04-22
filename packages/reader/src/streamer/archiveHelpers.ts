import { Archive } from './types'

export const getArchiveOpfInfo = (archive: Archive) => {
  const filesAsArray = Object.values(archive.files).filter(file => !file.dir)
  const file = filesAsArray.find(file => file.name.endsWith(`.opf`))

  return {
    data: file,
    basePath: file?.name.substring(0, file.name.lastIndexOf(`/`))
  }
}