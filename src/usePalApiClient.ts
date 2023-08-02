import { useAuth } from '@clerk/nextjs';
import axios, { type AxiosRequestConfig } from 'axios';
import { SSE } from 'sse.js';
import { JsonValue } from 'type-fest';

if (!process.env.NEXT_PUBLIC_PAL_API) {
  throw new Error('NEXT_PUBLIC_PAL_API is not defined');
}

const apiClient = axios.create({ baseURL: process.env.NEXT_PUBLIC_PAL_API });

export function usePalApiRequest() {
  const { getToken } = useAuth();
  return async <T = JsonValue>(config: AxiosRequestConfig) => {
    const token = await getToken();
    const response = await apiClient<T>({
      ...config,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  };
}

export function usePalApiSSERequest() {
  const { getToken } = useAuth();
  return async ({ url, data }: { url: string; data: unknown }) => {
    const token = await getToken();
    return new SSE(process.env.NEXT_PUBLIC_PAL_API + url, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      payload: JSON.stringify(data),
    });
  };
}
