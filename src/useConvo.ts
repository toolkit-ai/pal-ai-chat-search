import { useCallback, useReducer, useState } from 'react';
import { JsonObject } from 'type-fest';
import { v4 as uuid } from 'uuid';

import { usePalApiSSERequest } from './usePalApiClient';
import { ConversationMessage, messagesReducer } from '../messagesReducer';

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

export type ConversationMetadata = {
  contact?: Contact;
  organization?: ContactOrganization;
  metadata?: JsonObject;
};

const useConversation = ({
  applicationId,
  metadata,
}: {
  applicationId: string | null;
  metadata?: ConversationMetadata;
}) => {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, dispatch] = useReducer(messagesReducer, []);
  const updateMessage = useCallback(
    (message: ConversationMessage) => dispatch(['update', message]),
    [dispatch]
  );

  const [isProcessingResponse, setIsProcessingResponse] =
    useState<boolean>(false);

  const sendSseRequest = usePalApiSSERequest();

  const createAndPostUserMessage = async ({
    messageContent,
  }: {
    messageContent: string;
  }) => {
    if (!applicationId) {
      console.log('Application is not initialized');
      return;
    }

    const messageId = uuid();
    dispatch([
      'push',
      {
        id: messageId,
        content: messageContent,
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
      messageContent,
      isStreaming: true,
    };
    if (conversationId === null) {
      if (metadata?.contact) {
        requestData.contact = metadata.contact;
      }
      if (metadata?.organization) {
        requestData.organization = metadata.organization;
      }
      if (metadata?.metadata) {
        requestData.metadata = metadata.metadata;
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

    sseStream.stream();
  };

  return {
    messages,
    isProcessingResponse,
    createAndPostUserMessage,
    updateMessage,
  };
};

export default useConversation;
