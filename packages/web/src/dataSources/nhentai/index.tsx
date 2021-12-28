import { ObokuPlugin } from "@oboku/plugin-front"
import { UploadComponent } from "./UploadComponent";
import { SvgIcon } from "@material-ui/core"
import { ReactComponent as IconSvg } from './icon.svg'
import { useDownloadBook } from './useDownloadBook'

export const plugin: ObokuPlugin = {
  uniqueResourceIdentifier: 'nhentai',
  name: `nhentai`,
  synchronizable: false,
  type: `NHENTAI`,
  sensitive: true,
  UploadComponent,
  useDownloadBook,
  Icon: () => (
    <SvgIcon style={{ padding: 2, backgroundColor: `#1f1f1f`, borderRadius: 10 }}>
      <IconSvg width="100%" height="100%" />
    </SvgIcon>
  )
}