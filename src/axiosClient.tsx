import React, { FC, useEffect, useMemo } from 'react';
import axios from 'axios'
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
    getAuthorizationHeader: () => instance.defaults.headers.common['Authorization'],
    refreshMetadata: (bookId: string) =>
      instance.post(`${API_URI}/refresh-metadata/${bookId}`)
  }), [])