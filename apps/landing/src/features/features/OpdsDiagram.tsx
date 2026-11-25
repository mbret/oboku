import { DevicesRounded, TabletAndroidRounded } from "@mui/icons-material"
import { Typography } from "@mui/material"
import type { ReactElement } from "react"
import { FeatureIconBox } from "../common/FeatureIconBox"
import { ObokuLogoIcon } from "../common/ObokuLogoIcon"
import googleDriveLogo from "../common/source-logos/google-drive.svg"
import { SourceLogoImage } from "../common/SourceLogoImage"
import { WebDavIcon } from "../common/WebDavIcon"
import {
  DiagramFigure,
  DiagramGridBox,
  FlowArrowIcon,
  NodeColumnStack,
  NodeStack,
  ObokuNodeStack,
} from "./OpdsDiagram.styled"

const smallIconSize = 20

type DiagramNode = {
  icon: ReactElement
  label: string
  detail?: string
}

const sources: DiagramNode[] = [
  {
    icon: <SourceLogoImage src={googleDriveLogo} size={smallIconSize} />,
    label: "Google Drive",
  },
  { icon: <WebDavIcon fontSize="small" />, label: "WebDAV" },
]

const readingApps: DiagramNode[] = [
  {
    icon: <TabletAndroidRounded fontSize="small" />,
    label: "KOReader",
    detail: "E-readers",
  },
  {
    icon: <DevicesRounded fontSize="small" />,
    label: "OPDS apps",
    detail: "Phones, computers",
  },
]

function DiagramNodes({ nodes }: { nodes: DiagramNode[] }) {
  return (
    <NodeColumnStack>
      {nodes.map(function renderNode({ icon, label, detail }) {
        return (
          <NodeStack key={label}>
            <FeatureIconBox>{icon}</FeatureIconBox>
            <Typography variant="subtitle2" component="p">
              {label}
            </Typography>
            {detail && (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {detail}
              </Typography>
            )}
          </NodeStack>
        )
      })}
    </NodeColumnStack>
  )
}

export function OpdsDiagram() {
  return (
    <DiagramFigure aria-label="Books from Google Drive and WebDAV reach KOReader and other reading apps through oboku's OPDS server">
      <DiagramGridBox>
        <DiagramNodes nodes={sources} />
        <FlowArrowIcon />
        <ObokuNodeStack>
          <ObokuLogoIcon width={32} height={36} />
          <Typography
            variant="subtitle1"
            component="p"
            sx={{ fontWeight: 700 }}
          >
            oboku
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            OPDS server
          </Typography>
        </ObokuNodeStack>
        <FlowArrowIcon />
        <DiagramNodes nodes={readingApps} />
      </DiagramGridBox>
    </DiagramFigure>
  )
}
