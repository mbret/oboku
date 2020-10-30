import React, { useEffect } from 'react'
import { useApolloClient } from '@apollo/client';
import { GET_BOOKS } from './books/queries';
import localforage from 'localforage';
import { gql } from '@apollo/client';

export const RoutineProcess = () => {
  // useRevertInvalidDownloads()

  return null
}

const useRevertInvalidDownloads = () => {
  const client = useApolloClient()

  useEffect(() => {
    (async () => {
      try {
        const subscription = client.watchQuery({
          query: GET_BOOKS,
        }).subscribe(async ({ data }) => {
          subscription.unsubscribe()

          const lookForDownload = data.books.map(async (book) => {
            if (book.downloadState !== 'none') {
              const download = await localforage.getItem(`book-download-${book.id}`)
              console.log(`RoutineProcess checking download file of ${book.id} -> ${typeof download}`)
              return download ? null : book.id
            }
          })

          try {
            const toUpdate = await Promise.all(lookForDownload)

            client.writeQuery({
              query: GET_BOOKS,
              data: {
                books: data.books
                  .map(book => !toUpdate.includes(book.id) ? book : { ...book, downloadState: 'none' })
              },
            })
            console.log(client.readQuery({ query: GET_BOOKS }))
          } catch (e) {
            console.error(e)
          }
        })
      } catch (e) {
        console.error(e)
      }
    })()
  }, [client])
}