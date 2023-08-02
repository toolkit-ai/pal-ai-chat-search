import axios, { type AxiosRequestConfig } from 'axios';
import { SSE } from 'sse.js';
import { JsonValue } from 'type-fest';

import { DEFAULT_PAL_API_OPTIONS, PalApiOptions } from './palApiOptions';

type DecodedOptions = PalApiOptions & {
  baseURL: string;
  authHeaders: { Authorization: string } | { 'x-api-key': string };
};

async function decodeOptions(options: PalApiOptions): Promise<DecodedOptions> {
  let authHeaders;
  if ('getToken' in options) {
    const token = await options.getToken();
    if (token === null) {
      throw Error('getToken failed');
    }
    authHeaders = { Authorization: `Bearer ${token}` };
  } else {
    authHeaders = { 'x-api-key': options.apiKey };
  }

  return {
    ...DEFAULT_PAL_API_OPTIONS,
    ...options,
    authHeaders,
  };
}

export function usePalApiRequest(options: PalApiOptions) {
  return async <T = JsonValue>(config: AxiosRequestConfig) => {
    const { baseURL, authHeaders } = await decodeOptions(options);
    const response = await axios.request<T>({
      baseURL,
      ...config,
      headers: {
        ...authHeaders,
      },
    });
    return response.data;
  };
}

export function usePalApiSSERequest(options: PalApiOptions) {
  return async ({ url, data }: { url: string; data: unknown }) => {
    const { baseURL, authHeaders } = await decodeOptions(options);
    return new SSE(baseURL + url, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      payload: JSON.stringify(data),
    });
  };
}
