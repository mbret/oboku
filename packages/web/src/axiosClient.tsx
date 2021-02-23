import React, { FC, useEffect, useMemo } from 'react';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { useRecoilValue } from 'recoil';
import { authState } from './auth/authState';
import { API_URI } from './constants';

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
      credentials: { [key: string]: any },
      options?: AxiosRequestConfig
    ) => instance.get<any, AxiosResponse<Blob>>(`${API_URI}/download/${bookId}`, {
      responseType: 'blob',
      ...options,
      headers: {
        'oboku-credentials': JSON.stringify(credentials),
        ...options?.headers
      }
    }),

    getAuthorizationHeader: () => instance.defaults.headers.common['Authorization'],

    refreshMetadata: (bookId: string, credentials?: { [key: string]: any },) =>
      instance.post(`${API_URI}/refresh-metadata`, { bookId }, {
        // timeout: 60000, // 1mn
        // timeout: 1000,
        withCredentials: false,
        headers: {
          'oboku-credentials': JSON.stringify(credentials),
        }
      }),

    syncDataSource: (dataSourceId: string, credentials?: { [key: string]: any },) =>
      instance.post(`${API_URI}/sync-datasource`, { dataSourceId }, {
        headers: {
          'oboku-credentials': JSON.stringify(credentials),
        }
      }),
  }), [])