import { ConversationMessage } from './conversationMessage';

export type MessagesReducerAction =
  | ['push', ConversationMessage]
  | ['update', ConversationMessage]
  | ['updateContent', { id: string; token: string }]
  | ['reset'];

/**
 * A reducer for managing a list of `ConversationMessage`s whose contents are
 * potentially streamed in token-by-token using `updateContent`.
 */
export const messagesReducer = (
  messages: ConversationMessage[],
  action: MessagesReducerAction
) => {
  switch (action[0]) {
    case 'push': {
      const newMessage = action[1];
      if (!messages.some((m) => m.id === newMessage.id)) {
        return [...messages, newMessage];
      }
      return messages;
    }
    case 'update': {
      const message = action[1];
      return messages.map((m) => {
        if (m.id === message.id) {
          return message;
        }
        return m;
      });
    }
    case 'updateContent': {
      const { id, token } = action[1];
      return messages.map((m) => {
        if (m.id !== id) {
          return m;
        }
        return {
          ...m,
          content: m.content + token,
        };
      });
    }
    case 'reset': {
      return [];
    }
  }
};
