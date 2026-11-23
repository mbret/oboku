import {
  ArrowForwardRounded,
  CloudRounded,
  DevicesRounded,
  DnsRounded,
  TabletAndroidRounded,
} from "@mui/icons-material"
import type { SvgIconComponent } from "@mui/icons-material"
import { Typography } from "@mui/material"
import { FeatureIconBox } from "../common/FeatureIconBox"
import { ObokuLogoIcon } from "../common/ObokuLogoIcon"
import {
  ArrowStack,
  DiagramFigure,
  DiagramGridBox,
  NodeStack,
  NodesStack,
  ObokuNodeStack,
} from "./OpdsDiagram.styled"

type DiagramNode = {
  Icon: SvgIconComponent
  label: string
  detail?: string
}

const sources: DiagramNode[] = [
  { Icon: CloudRounded, label: "Google Drive" },
  { Icon: DnsRounded, label: "WebDAV" },
]

const readingApps: DiagramNode[] = [
  { Icon: TabletAndroidRounded, label: "KOReader", detail: "E-readers" },
  { Icon: DevicesRounded, label: "OPDS apps", detail: "Phones, computers" },
]

function DiagramNodes({ nodes }: { nodes: DiagramNode[] }) {
  return (
    <NodesStack>
      {nodes.map(function renderNode({ Icon, label, detail }) {
        return (
          <NodeStack key={label}>
            <FeatureIconBox>
              <Icon fontSize="small" />
            </FeatureIconBox>
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
    </NodesStack>
  )
}

function FlowArrow() {
  return (
    <ArrowStack aria-hidden="true">
      <ArrowForwardRounded />
    </ArrowStack>
  )
}

export function OpdsDiagram() {
  return (
    <DiagramFigure aria-label="Books from Google Drive and WebDAV reach KOReader and other reading apps through oboku's OPDS server">
      <DiagramGridBox>
        <DiagramNodes nodes={sources} />
        <FlowArrow />
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
        <FlowArrow />
        <DiagramNodes nodes={readingApps} />
      </DiagramGridBox>
    </DiagramFigure>
  )
}
