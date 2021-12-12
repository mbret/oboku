import { FC, memo } from 'react'
import { ListItem, ListItemText, useTheme } from "@material-ui/core"
import { useCSS } from '../../common/utils';
import { useRecoilValue } from 'recoil';
import { normalizedCollectionsState } from '../states';
import { Checkbox } from '../../common/Checkbox';

export const SelectableCollectionListItem: FC<{
  id: string
  onItemClick?: (tag: string) => void,
  selected: boolean,
}> = memo(({ id, onItemClick, selected }) => {
  const data = useRecoilValue(normalizedCollectionsState)[id]
  const styles = useStyle()

  return (
    <ListItem
      button
      style={styles.container}
      onClick={() => data && onItemClick && onItemClick(data?._id)}
    >
      <ListItemText
        primary={data?.name}
      />
      <div style={styles.infoIcon}>
      </div>
      <Checkbox selected={selected} />
    </ListItem>
  )
})

const useStyle = () => {
  const theme = useTheme()

  return useCSS(() => ({
    container: {
      height: `100%`
    },
    infoIcon: {
      marginRight: theme.spacing(1),
    }
  }), [theme])
}