import React, { ComponentProps, FC, useMemo } from 'react'
import { BookList } from '../books/BookList';
import { useQuery } from '@apollo/client';
import { QueryOneSeriesBookIdsDocument } from '../generated/graphql';

export const SeriesBookList: FC<{
  seriesId: string,
  renderHeader: ComponentProps<typeof BookList>['renderHeader']
  headerHeight: ComponentProps<typeof BookList>['headerHeight']
}> = ({ seriesId, renderHeader, headerHeight }) => {
  const { data: seriesData } = useQuery(QueryOneSeriesBookIdsDocument, { variables: { id: seriesId } })
  const books = seriesData?.oneSeries?.books || []
  const data = useMemo(() => books.map(book => book?.id || '-1'), [books])

  console.log('[BookList]', seriesData)

  return (
    <BookList
      data={data}
      style={{ height: '100%', width: '100%' }}
      headerHeight={headerHeight}
      renderHeader={renderHeader}
    />
  )
}