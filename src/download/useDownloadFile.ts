import React, { useRef } from 'react'
import { useQuery, useMutation, useApolloClient, gql } from '@apollo/client';
import { GET_BOOKS, EDIT_BOOK, GET_BOOK } from '../books/queries';
import localforage from 'localforage';
import { API_URI } from '../constants';

export const useDownloadFile = () => {
  const client = useApolloClient()

  return async (bookId: string) => {
    try {
      const data = client.readQuery({ query: GET_BOOKS })
      client.writeQuery({
        query: GET_BOOKS,
        data: { books: data.books.map(book => book.id !== bookId ? book : { ...book, downloadState: 'downloading' }) },
      })
      try {
        const response = await fetch(`${API_URI}/download/${bookId}`)
        if (!response.ok) {
          throw new Error(response.statusText)
        }
        await localforage.setItem(`book-download-${bookId}`, await response.arrayBuffer())
        client.writeQuery({
          query: GET_BOOKS,
          data: { books: data.books.map(book => book.id !== bookId ? book : { ...book, downloadState: 'downloaded' }) },
        })
      } catch (e) {
        client.writeQuery({
          query: GET_BOOKS,
          data: { books: data.books.map(book => book.id !== bookId ? book : { ...book, downloadState: 'none' }) },
        })
      }
    } catch (e) {
      console.error(e)
    }
  }
}