import { readFile } from "node:fs/promises"
import path from "node:path"
import { ImageResponse } from "next/og"
import { design } from "@oboku/shared"
import { ObokuLogoIcon } from "../features/common/ObokuLogoIcon"
import { landingTagline } from "../features/home/content"

export const alt = `oboku – ${landingTagline}, next to a phone showing an oboku library`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const screenshotHeight = 540
const screenshotWidth = Math.round((screenshotHeight * 750) / 1334)

export default async function OpenGraphImage() {
  const libraryScreenshot = await readFile(
    path.join(
      process.cwd(),
      "src/features/home/assets/oboku-git-develop-mbret.vercel.app_library_books(iPhone SE).png",
    ),
  )

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        backgroundColor: "white",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          flex: 1,
          padding: "0 72px",
          gap: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <ObokuLogoIcon height={100} />
          <div
            style={{
              fontSize: 112,
              letterSpacing: -2,
              color: design.palette.orange,
            }}
          >
            oboku
          </div>
        </div>
        <div style={{ fontSize: 50, lineHeight: 1.2, color: "#1f1f1f" }}>
          {landingTagline}
        </div>
        <div style={{ fontSize: 28, lineHeight: 1.4, color: "#5f5f5f" }}>
          EPUB, comics, PDF · Google Drive, Dropbox, OneDrive, WebDAV, Synology
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 420,
          backgroundColor: "#fdeee8",
        }}
      >
        {/* biome-ignore lint/performance/noImgElement: ImageResponse renders plain HTML, next/image does not apply */}
        <img
          alt=""
          src={`data:image/png;base64,${libraryScreenshot.toString("base64")}`}
          width={screenshotWidth}
          height={screenshotHeight}
          style={{ borderRadius: 24, border: "8px solid #1f1f1f" }}
        />
      </div>
    </div>,
    size,
  )
}
