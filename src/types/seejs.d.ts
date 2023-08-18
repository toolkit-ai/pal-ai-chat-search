declare module 'sse.js' {
  interface SSEOptions {
    headers: Record<string, string>;
    method: string;
    payload: string;
    withCredentials: boolean;
  }

  interface SSEEvent {
    data: string;
  }

  export class SSE extends EventTarget {
    constructor(url: string, options: Partial<SSEOptions>);
    addEventListener(type: string, callback: (event: SSEEvent) => void): void;
    stream();
    close();
  }
}
