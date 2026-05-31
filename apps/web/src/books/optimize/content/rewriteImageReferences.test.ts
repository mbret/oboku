// @vitest-environment jsdom
import JSZip from "jszip"
import { describe, expect, it } from "vitest"
import { rewriteImageReferences } from "./rewriteImageReferences"

describe("rewriteImageReferences", () => {
  it("does not rewrite references to a skipped image sharing a basename with a converted one in another folder", async () => {
    const zip = new JSZip()
    zip.file("chapter1/index.xhtml", `<img src="page.jpg"/>`)
    zip.file("chapter2/index.xhtml", `<img src="page.jpg"/>`)

    await rewriteImageReferences(zip, new Set(["chapter1/page.jpg"]))

    expect(await zip.file("chapter1/index.xhtml")?.async("string")).toBe(
      `<img src="page.webp"/>`,
    )
    expect(await zip.file("chapter2/index.xhtml")?.async("string")).toBe(
      `<img src="page.jpg"/>`,
    )
  })

  it("rewrites relative references resolved against the referencing document", async () => {
    const zip = new JSZip()
    zip.file(
      "OEBPS/text/chapter.xhtml",
      `<image xlink:href="../images/cover.png?v=1"/>`,
    )

    await rewriteImageReferences(zip, new Set(["OEBPS/images/cover.png"]))

    expect(await zip.file("OEBPS/text/chapter.xhtml")?.async("string")).toBe(
      `<image xlink:href="../images/cover.webp?v=1"/>`,
    )
  })

  it("rewrites percent-encoded references against unescaped archive entry names", async () => {
    const zip = new JSZip()
    zip.file("OEBPS/text/chapter.xhtml", `<img src="../images/page%201.jpg"/>`)
    zip.file(
      "OEBPS/content.opf",
      `<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf"><manifest><item id="a" href="images/page%201.jpg" media-type="image/jpeg"/></manifest></package>`,
    )

    await rewriteImageReferences(zip, new Set(["OEBPS/images/page 1.jpg"]))

    expect(await zip.file("OEBPS/text/chapter.xhtml")?.async("string")).toBe(
      `<img src="../images/page%201.webp"/>`,
    )

    const opf = await zip.file("OEBPS/content.opf")?.async("string")

    expect(opf).toContain(`href="images/page%201.webp"`)
    expect(opf).toContain(`media-type="image/webp"`)
  })

  it("rewrites quoted references whose paths contain spaces", async () => {
    const zip = new JSZip()
    zip.file("OEBPS/text/chapter.xhtml", `<img src="../images/page 1.jpg"/>`)
    zip.file(
      "OEBPS/styles/main.css",
      `.cover { background: url("../images/page 1.jpg"); }`,
    )
    zip.file(
      "OEBPS/styles/bare.css",
      `.bg { background: url(../images/page 1.jpg); }`,
    )

    await rewriteImageReferences(zip, new Set(["OEBPS/images/page 1.jpg"]))

    expect(await zip.file("OEBPS/text/chapter.xhtml")?.async("string")).toBe(
      `<img src="../images/page 1.webp"/>`,
    )
    expect(await zip.file("OEBPS/styles/main.css")?.async("string")).toBe(
      `.cover { background: url("../images/page 1.webp"); }`,
    )
    expect(await zip.file("OEBPS/styles/bare.css")?.async("string")).toBe(
      `.bg { background: url(../images/page 1.webp); }`,
    )
  })

  it("rewrites href and media-type of converted OPF manifest items only", async () => {
    const zip = new JSZip()
    zip.file(
      "OEBPS/content.opf",
      `<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf"><manifest><item id="a" href="images/a.jpg" media-type="image/jpeg"/><item id="b" href="images/b.jpg" media-type="image/jpeg"/></manifest></package>`,
    )

    await rewriteImageReferences(zip, new Set(["OEBPS/images/a.jpg"]))

    const opf = await zip.file("OEBPS/content.opf")?.async("string")

    expect(opf).toContain(`href="images/a.webp"`)
    expect(opf).toContain(`media-type="image/webp"`)
    expect(opf).toContain(`href="images/b.jpg"`)
    expect(opf).toContain(`media-type="image/jpeg"`)
  })

  it("leaves external urls untouched", async () => {
    const zip = new JSZip()
    zip.file(
      "index.xhtml",
      `<a href="https://example.com/page.jpg">x</a><img src="cover.jpg"/>`,
    )

    await rewriteImageReferences(zip, new Set(["cover.jpg"]))

    expect(await zip.file("index.xhtml")?.async("string")).toBe(
      `<a href="https://example.com/page.jpg">x</a><img src="cover.webp"/>`,
    )
  })

  it("does nothing when no images were converted", async () => {
    const zip = new JSZip()
    zip.file("index.xhtml", `<img src="page.jpg"/>`)

    await rewriteImageReferences(zip, new Set())

    expect(await zip.file("index.xhtml")?.async("string")).toBe(
      `<img src="page.jpg"/>`,
    )
  })
})
