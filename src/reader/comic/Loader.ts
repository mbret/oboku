import JSZip, { loadAsync } from 'jszip'
import { compareLists } from './utils'
import './style.css'

type LoadableFile = { name: string }

abstract class Loaded {
  constructor(public files: LoadableFile[]) { }

  abstract getFile(filenam: string): Promise<string | undefined>

  abstract getType(): 'comic' | 'file'
}

class LoadedJSZip extends Loaded {
  constructor(public files: LoadableFile[], public jszip: JSZip) {
    super(files)
  }

  public async getFile(filename: string) {
    return await this.jszip.file(filename)?.async('base64')
  }

  public getType() {
    return 'comic' as const
  }
}

class LoadedFile extends Loaded {
  constructor(public files: LoadableFile[], public data: Blob | File) {
    super(files)
  }

  public async getFile(filename: string) {
    return await this.data.text()
  }

  public getType() {
    return 'file' as const
  }
}

export const load = async (data: Blob | File) => {
  if (['text/xml'].includes(data.type)
    || (data instanceof File && (data.name.endsWith('.txt')))
  ) {
    const files = [{ name: data instanceof File ? data.name : 'unknown' }]
    return new LoadedFile(files, data)
  }

  if (data instanceof Blob) {
    const jszip = await loadAsync(data)
    const filesAsArray = Object.values(jszip.files).filter(file => !file.dir)
    const sortedKeys = filesAsArray.map(f => f.name).sort(compareLists)
    const files = sortedKeys
      .map(name => {
        const file = filesAsArray.find(f => f.name === name) as JSZip.JSZipObject

        return {
          name: file.name
        }
      })

    return new LoadedJSZip(files, jszip)
  } else {
    throw new Error('Invalid format')
  }
}