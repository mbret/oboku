import { XMLParser } from "fast-xml-parser"

export const parseXmlAsJson = (xml: string) => {
  const parser = new XMLParser({
    attributeNamePrefix: "",
    ignoreAttributes: false
  })
  return parser.parse(xml)
}
