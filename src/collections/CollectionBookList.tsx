import React, { ComponentProps, FC, useMemo } from 'react'
import { BookList } from '../books/bookList/BookList';
import { useRecoilValue } from 'recoil';
import { collectionState } from './states';

export const CollectionBookList: FC<{
  collectionId: string,
  renderHeader: ComponentProps<typeof BookList>['renderHeader']
  headerHeight: ComponentProps<typeof BookList>['headerHeight']
}> = ({ collectionId, renderHeader, headerHeight }) => {
  const collection = useRecoilValue(collectionState(collectionId || '-1'))
  const books = collection?.books
  const data = useMemo(() => books?.map(book => book || '-1'), [books]) || []

  return (
    <BookList
      data={data}
      style={{ height: '100%', width: '100%' }}
      headerHeight={headerHeight}
      renderHeader={renderHeader}
    />
  )
}