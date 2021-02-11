import React, { ComponentProps, FC, useState } from 'react'
import { ListActionsToolbar } from '../../lists/ListActionsToolbar'
import { useBookIdsSortedBy } from '../helpers'
import { BookList } from './BookList'

type Sorting = ComponentProps<typeof ListActionsToolbar>['sorting']

export const BookListWithControls: FC<{
  data: string[],
  renderEmptyList?: React.ReactNode
}> = ({ data, renderEmptyList }) => {
  const [innerViewMode, setInnerViewMode] = useState<'list' | 'grid'>('grid')
  const [sorting, setSorting] = useState<Sorting>(undefined)
  const sortedData = useBookIdsSortedBy(data, sorting)
  
  return (
    <div style={{
      display: 'flex',
      height: '100%',
      flex: 1,
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <ListActionsToolbar
        viewMode={innerViewMode}
        onViewModeChange={setInnerViewMode}
        sorting={sorting}
        onSortingChange={setSorting}
      />
      <div style={{
        display: 'flex',
        height: '100%',
        overflow: 'scroll',
        flex: 1
      }}>
        {sortedData.length === 0 && !!renderEmptyList && renderEmptyList}
        {sortedData.length > 0 && (
          <BookList
            data={sortedData}
            viewMode={innerViewMode}
            style={{ height: '100%', width: '100%' }}
          />
        )}
      </div>
    </div>
  )
}