import React, { ComponentProps, FC, useMemo } from 'react'
import { BookList } from '../books/BookList';
import { useQuery } from '@apollo/client';
import { QueryCollectionBookIdsDocument } from '../generated/graphql';

export const CollectionBookList: FC<{
  collectionId: string,
  renderHeader: ComponentProps<typeof BookList>['renderHeader']
  headerHeight: ComponentProps<typeof BookList>['headerHeight']
}> = ({ collectionId, renderHeader, headerHeight }) => {
  const { data: collectionData } = useQuery(QueryCollectionBookIdsDocument, { variables: { id: collectionId } })
  const books = collectionData?.collection?.books || []
  const data = useMemo(() => books.map(book => book?.id || '-1'), [books])

  console.log('[BookList]', collectionData)

  return (
    <BookList
      data={data}
      style={{ height: '100%', width: '100%' }}
      headerHeight={headerHeight}
      renderHeader={renderHeader}
    />
  )
}