import { parseXmlAsJson } from "./parseXmlAsJson"
import { describe, it, expect } from "vitest"

describe("Given basic xml", () => {
  it("should return valid json", async () => {
    const xml = `
    <?xml version="1.0" encoding="utf-8" standalone="no"?>
    <html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en">
      <head>
        <title>Cover</title>
      </head>
      <body>
      </body>
    </html>
    `

    expect(await parseXmlAsJson(xml)).toEqual({
      "?xml": {
        encoding: "utf-8",
        standalone: "no",
        version: "1.0"
      },
      html: {
        body: "",
        lang: "en",
        "xml:lang": "en",
        xmlns: "http://www.w3.org/1999/xhtml",
        "xmlns:epub": "http://www.idpf.org/2007/ops",
        head: { title: "Cover" }
      }
    })
  })
})
