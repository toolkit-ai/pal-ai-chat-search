import { useCallback, useReducer, useState } from 'react';
import { JsonObject } from 'type-fest';
import { v4 as uuid } from 'uuid';

import { ConversationMessage } from './conversationMessage';
import { messagesReducer } from './messagesReducer';
import { PalApiOptions } from './palApiOptions';
import { usePalApiSSERequest } from './usePalApiClient';

type UseChatOptions = PalApiOptions & {
  applicationId: string | null;
  metadata?: ConversationMetadata;
};

export type ConversationMetadata = {
  contact?: Contact;
  organization?: ContactOrganization;
  metadata?: JsonObject;
};

type ContactBase = {
  name?: string;
};
type ContactId =
  | { palUserId: string }
  | { externalId: string }
  | { email: string };
type Contact = ContactBase & ContactId;

type ContactOrganization = {
  externalId: string;
  name?: string;
};

interface UseChatResult {
  messages: ConversationMessage[];
  isProcessingResponse: boolean;
  sendMessage: (content: string) => Promise<void>;
  reset: () => void;
}

/**
 * `useChat` is a React hook for building AI chat experiences using Pal.
 *
 * @param options Options for connecting to Pal. An `applicationId` and `apiKey`
 * are required.
 * @returns The current conversation state.
 */
export const useChat = (options: UseChatOptions): UseChatResult => {
  return useChatInternal(options);
};

export default useChat;

interface UseChatInternalResult extends UseChatResult {
  updateMessage: (message: ConversationMessage) => void;
}

/**
 * Use `useChat` instead.
 *
 * TODO Implement `setMessageFeedback` and have that update `messages`. Then we
 * can remove `updateMessage`, which is currently only used to set feedback on
 * messages after POSTing succeeds.
 */
export const useChatInternal = (
  options: UseChatOptions
): UseChatInternalResult => {
  const { applicationId, metadata } = options;
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, dispatch] = useReducer(messagesReducer, []);
  const updateMessage = useCallback(
    (message: ConversationMessage) => dispatch(['update', message]),
    [dispatch]
  );
  const reset = useCallback(() => {
    dispatch(['reset']);
    setConversationId(null);
  }, []);

  const [isProcessingResponse, setIsProcessingResponse] =
    useState<boolean>(false);

  const sendSseRequest = usePalApiSSERequest(options);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!applicationId) {
        console.log('Application is not initialized');
        return;
      }

      const messageId = uuid();
      dispatch([
        'push',
        {
          id: messageId,
          content,
          feedback: [],
          type: 'text',
          role: 'user',
        },
      ]);

      setIsProcessingResponse(true);

      const requestData: JsonObject = {
        applicationId,
        conversationId: conversationId || null,
        messageId,
        messageContent: content,
        isStreaming: true,
      };
      if (conversationId === null) {
        if (metadata?.contact) {
          requestData['contact'] = metadata.contact;
        }
        if (metadata?.organization) {
          requestData['organization'] = metadata.organization;
        }
        if (metadata?.metadata) {
          requestData['metadata'] = metadata.metadata;
        }
      }
      const sseStream = await sendSseRequest({
        url: '/conversations',
        data: requestData,
      });

      sseStream.addEventListener('conversation-id', ({ data }) => {
        setConversationId(data);
      });

      sseStream.addEventListener('message', ({ data }) => {
        if (data) {
          const message = JSON.parse(data);
          dispatch(['push', message]);
        }
      });

      sseStream.addEventListener('message-token', ({ data }) => {
        if (data) {
          const { messageId, token } = JSON.parse(data);
          dispatch(['updateContent', { id: messageId, token }]);
        }
      });

      sseStream.addEventListener('stream-end', () => {
        sseStream.close();
        setIsProcessingResponse(false);
      });

      sseStream.addEventListener('error', ({ data }) => {
        console.error('SSE error:', data);
      });

      sseStream.stream();
    },
    [applicationId, conversationId, metadata, sendSseRequest]
  );

  return {
    messages,
    isProcessingResponse,
    sendMessage,
    updateMessage,
    reset,
  };
};
