import React, { FC, useEffect, useMemo } from 'react';
import axios, { AxiosRequestConfig } from 'axios'
import { useRecoilValue } from 'recoil';
import { authState } from './auth/authState';
import { API_SYNC_URL, API_URI } from './constants';
import PouchDB from 'pouchdb'

const instance = axios.create();

export const AxiosProvider: FC = ({ children }) => {
  const { token } = useRecoilValue(authState) || {}

  useEffect(() => {
    instance.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }, [token])

  return (
    <>{children}</>
  )
}

export const useAxiosClient = () =>
  useMemo(() => ({

    downloadBook: (
      bookId: string,
      options?: AxiosRequestConfig
    ) => instance.get(`${API_URI}/download/${bookId}`, {
      responseType: 'blob',
      ...options,
    }),

    getAuthorizationHeader: () => instance.defaults.headers.common['Authorization'],

    refreshMetadata: (bookId: string) =>
      instance.post(`${API_URI}/refresh-metadata/${bookId}`),

    syncDataSource: (dataSourceId: string) =>
      instance.post(`${API_URI}/sync-datasource/${dataSourceId}`),

    getPouchDbRemoteInstance: () => new PouchDB(API_SYNC_URL, {
      fetch: (url, opts) => {
        (opts?.headers as unknown as Map<string, string>).set('Authorization', instance.defaults.headers.common['Authorization'])
        return PouchDB.fetch(url, opts)
      }
    })
  }), [])