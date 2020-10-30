import React, { useMemo, FC, ComponentProps } from 'react'
import { useScrollbarWidth, useMeasure } from 'react-use';
import { RecyclerListView, DataProvider, LayoutProvider } from "recyclerlistview/web";

//Create the data provider and provide method which takes in two rows of data and return if those two are different or not.
//THIS IS VERY IMPORTANT, FORGET PERFORMANCE IF THIS IS MESSED UP
const initialDataProvider = new DataProvider((r1, r2) => {
  return r1 !== r2;
})

export const ItemList: FC<{
  rowRenderer: ComponentProps<typeof RecyclerListView>['rowRenderer'],
  data: any[],
  numberOfItems: number,
  preferredRatio: number,
  className?: string,
}> = ({ rowRenderer, data, numberOfItems, preferredRatio = 1, className }) => {
  const sbw = useScrollbarWidth() || 0;
  const [ref, { width }] = useMeasure();

  const itemWidth = (width - sbw) / numberOfItems
  const itemHeight = itemWidth / preferredRatio

  //Create the layout provider
  //First method: Given an index return the type of item e.g ListItemType1, ListItemType2 in case you have variety of items in your list/grid
  //Second: Given a type and object set the exact height and width for that type on given object, if you're using non deterministic rendering provide close estimates
  //If you need data based check you can access your data provider here
  //You'll need data in most cases, we don't provide it by default to enable things like data virtualization in the future
  //NOTE: For complex lists LayoutProvider will also be complex it would then make sense to move it to a different file
  const layoutProvider = useMemo(() => new LayoutProvider(
    index => 1,
    (type, dim) => {
      dim.width = itemWidth
      dim.height = itemHeight
    }
  ), [itemWidth, itemHeight])

  const dataProvider = useMemo(() => initialDataProvider.cloneWithRows(data), [data])

  return (
    <div style={{ display: 'flex', height: 1, flexGrow: 1, flex: 1 }} className={className} ref={ref as any}>
      <RecyclerListView
        layoutProvider={layoutProvider}
        dataProvider={dataProvider}
        rowRenderer={rowRenderer}
        scrollViewProps={{
          showsVerticalScrollIndicator: false,
          useWindowScroll: false,
          style: {
            width: '100%',
            backgroundColor: 'red'
          }
        }}
      />
    </div>
  )
}