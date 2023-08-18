export type PalApiOptions = {
  baseURL?: string;
} & PalAuthOptions;

type PalAuthOptions =
  | {
      /** Your Pal API key, from the Settings page. */
      apiKey: string;
    }
  | {
      /** For internal use only. */
      getToken: () => Promise<string | null>;
    };

export const DEFAULT_PAL_API_OPTIONS = {
  baseURL: 'https://api.pal.ai/v1',
};
