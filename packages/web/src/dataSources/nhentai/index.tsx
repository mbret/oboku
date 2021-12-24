import { dataSourcePlugins } from "@oboku/shared";
import { ObokuDataSourcePlugin } from "../types";
import { UploadComponent } from "./UploadComponent";
import { SvgIcon } from "@material-ui/core"
import { ReactComponent as IconSvg } from './icon.svg'
import { useDownloadBook } from './useDownloadBook'

export const plugin: ObokuDataSourcePlugin = {
  ...dataSourcePlugins.NHENTAI!,
  UploadComponent,
  useDownloadBook,
  Icon: () => (
    <SvgIcon style={{ padding: 2, backgroundColor: `#1f1f1f`, borderRadius: 10 }}>
      <IconSvg width="100%" height="100%" />
    </SvgIcon>
  )
}