// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import {
  type EditableArchive,
  readEntryText,
} from "../archives/editableArchive"
import { rewriteImageReferences } from "./rewriteImageReferences"

const archiveOf = (files: Record<string, string>): EditableArchive =>
  new Map(
    Object.entries(files).map(([path, content]) => [
      path,
      { dir: false, content },
    ]),
  )

const textOf = (entries: EditableArchive, path: string): Promise<string> => {
  const entry = entries.get(path)

  if (!entry) throw new Error(`missing entry: ${path}`)

  return readEntryText(entry.content)
}

describe("rewriteImageReferences", () => {
  it("does not rewrite references to a skipped image sharing a basename with a converted one in another folder", async () => {
    const entries = archiveOf({
      "chapter1/index.xhtml": `<img src="page.jpg"/>`,
      "chapter2/index.xhtml": `<img src="page.jpg"/>`,
    })

    await rewriteImageReferences(entries, new Set(["chapter1/page.jpg"]))

    expect(await textOf(entries, "chapter1/index.xhtml")).toBe(
      `<img src="page.webp"/>`,
    )
    expect(await textOf(entries, "chapter2/index.xhtml")).toBe(
      `<img src="page.jpg"/>`,
    )
  })

  it("rewrites relative references resolved against the referencing document", async () => {
    const entries = archiveOf({
      "OEBPS/text/chapter.xhtml": `<image xlink:href="../images/cover.png?v=1"/>`,
    })

    await rewriteImageReferences(entries, new Set(["OEBPS/images/cover.png"]))

    expect(await textOf(entries, "OEBPS/text/chapter.xhtml")).toBe(
      `<image xlink:href="../images/cover.webp?v=1"/>`,
    )
  })

  it("rewrites percent-encoded references against unescaped archive entry names", async () => {
    const entries = archiveOf({
      "OEBPS/text/chapter.xhtml": `<img src="../images/page%201.jpg"/>`,
      "OEBPS/content.opf": `<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf"><manifest><item id="a" href="images/page%201.jpg" media-type="image/jpeg"/></manifest></package>`,
    })

    await rewriteImageReferences(entries, new Set(["OEBPS/images/page 1.jpg"]))

    expect(await textOf(entries, "OEBPS/text/chapter.xhtml")).toBe(
      `<img src="../images/page%201.webp"/>`,
    )

    const opf = await textOf(entries, "OEBPS/content.opf")

    expect(opf).toContain(`href="images/page%201.webp"`)
    expect(opf).toContain(`media-type="image/webp"`)
  })

  it("rewrites quoted references whose paths contain spaces", async () => {
    const entries = archiveOf({
      "OEBPS/text/chapter.xhtml": `<img src="../images/page 1.jpg"/>`,
      "OEBPS/styles/main.css": `.cover { background: url("../images/page 1.jpg"); }`,
      "OEBPS/styles/bare.css": `.bg { background: url(../images/page 1.jpg); }`,
    })

    await rewriteImageReferences(entries, new Set(["OEBPS/images/page 1.jpg"]))

    expect(await textOf(entries, "OEBPS/text/chapter.xhtml")).toBe(
      `<img src="../images/page 1.webp"/>`,
    )
    expect(await textOf(entries, "OEBPS/styles/main.css")).toBe(
      `.cover { background: url("../images/page 1.webp"); }`,
    )
    expect(await textOf(entries, "OEBPS/styles/bare.css")).toBe(
      `.bg { background: url(../images/page 1.webp); }`,
    )
  })

  it("rewrites href and media-type of converted OPF manifest items only", async () => {
    const entries = archiveOf({
      "OEBPS/content.opf": `<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf"><manifest><item id="a" href="images/a.jpg" media-type="image/jpeg"/><item id="b" href="images/b.jpg" media-type="image/jpeg"/></manifest></package>`,
    })

    await rewriteImageReferences(entries, new Set(["OEBPS/images/a.jpg"]))

    const opf = await textOf(entries, "OEBPS/content.opf")

    expect(opf).toContain(`href="images/a.webp"`)
    expect(opf).toContain(`media-type="image/webp"`)
    expect(opf).toContain(`href="images/b.jpg"`)
    expect(opf).toContain(`media-type="image/jpeg"`)
  })

  it("leaves external urls untouched", async () => {
    const entries = archiveOf({
      "index.xhtml": `<a href="https://example.com/page.jpg">x</a><img src="cover.jpg"/>`,
    })

    await rewriteImageReferences(entries, new Set(["cover.jpg"]))

    expect(await textOf(entries, "index.xhtml")).toBe(
      `<a href="https://example.com/page.jpg">x</a><img src="cover.webp"/>`,
    )
  })

  it("does nothing when no images were converted", async () => {
    const entries = archiveOf({ "index.xhtml": `<img src="page.jpg"/>` })

    await rewriteImageReferences(entries, new Set())

    expect(await textOf(entries, "index.xhtml")).toBe(`<img src="page.jpg"/>`)
  })
})
