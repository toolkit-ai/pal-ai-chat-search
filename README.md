# Pal AI Chat & Search

React components for creating A.I. chat and search experiences using using [Pal](https://www.pal.ai/).
Use the Pal Dashboard to import documents and review conversations, then present a fully-customized front-end to your users.

## Roadmap

- [x] `useChat` React hook
- [ ] Pre-made `Chat` component whose elements can be styled with CSS
- [ ] Swappable sub-components, e.g. `<Chat Avatar={CustomAvatar} ... />`
- [ ] Custom layouts, theming, etc.

## Usage

```js
npm install @heypal/pal-ai-chat-search
```

```tsx
import React, { useRef } from 'react';
import { useChat } from '@heypal/pal-ai-chat-search';

const Chat = () => {
  const { messages, sendMessage, isProcessingResponse } = useChat({
    applicationId: process.env.NEXT_PUBLIC_PAL_APPLICATION_ID,
    apiKey: process.env.NEXT_PUBLIC_PAL_API_KEY,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const onSubmit = (e: FormEvent) => {
    if (!inputRef.current) return;
    e.preventDefault();
    sendMessage(inputRef.current.value);
    inputRef.current.value = '';
  };

  return (
    <div>
      {messages.map((message: ConversationMessage) => {
        if (message.type === 'search-results') {
          // `search-results` are sections of documents that might be relevant
          // to the user's message. Pal provides them to the LLM, and you can
          // optionally display them directly to the user.
          return (
            <ul key={message.id}>
              {message.searchResultSet?.documents.map((document) => (
                <li key={document.id}>{document.contentPreview}</li>
              ))}
            </ul>
          );
        }
        if (message.role === 'system') {
          // `system` messages contain the prompt. They aren't typically shown
          // to the user.
          return;
        }
        // By this point, `message.role` will be either `user` or `assistant`.
        return (
          <div key={message.id}>
            {message.role}: {message.content}
          </div>
        );
      })}
      <div>{isProcessingResponse ? '...' : null}</div>
      <form onSubmit={onSubmit}>
        <input type="text" ref={inputRef} placeholder="input" />
      </form>
    </div>
  );
};
```
