import { Archive } from "../types";
import xmldoc from 'xmldoc'

type KoboInformation = {
  renditionLayout?: `reflowable` | `pre-paginated` | undefined
}

export const extractKoboInformationFromArchive = async (archive: Archive) => {
  let koboInformation: KoboInformation = {
    renditionLayout: undefined
  }

  await Promise.all(archive.files.map(async file => {
    if (file.name.endsWith(`com.kobobooks.display-options.xml`)) {
      const opfXmlDoc = new xmldoc.XmlDocument(await file.string())
      const optionElement = opfXmlDoc.childNamed(`platform`)?.childNamed(`option`)
      if (optionElement?.attr?.name === `fixed-layout` && optionElement.val === `true`) {
        koboInformation.renditionLayout = `pre-paginated`
      }
    }
  }))

  return koboInformation
}