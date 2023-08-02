import { z } from 'zod';

import { Rating } from './hooks/mutations/usePostFeedbackById';

const SearchResultsWithContentSchema = z.object({
  documents: z.array(
    z.object({
      id: z.string(),
      title: z.nullable(z.string()),
      url: z.optional(z.nullable(z.string())),
      contentPreview: z.optional(z.nullable(z.string())),
    })
  ),
  sections: z.array(
    z.object({
      id: z.string(),
      heading: z.nullable(z.string()),
      text: z.string(),
      documentId: z.string(),
      applicationId: z.string(),
      indexOrder: z.nullable(z.number()),
      indexId: z.nullable(z.string()),
      indexName: z.nullable(z.string()),
      indexInfo: z.nullable(z.any()),
    })
  ),
});

const MessageFeedbackSchema = z.object({
  id: z.string(),
  rating: z.enum([Rating.ThumbsUp, Rating.ThumbsDown]),
  content: z.any(),
});

export const ConversationMessageSchema = z.object({
  id: z.string(),
  content: z.string(),
  type: z.enum(['text', 'search-results']),
  role: z.enum(['user', 'assistant', 'system']),
  feedback: z.array(MessageFeedbackSchema),
  searchResultSet: z.optional(z.nullable(SearchResultsWithContentSchema)),
});

export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;
export type SearchResultsWithContent = z.infer<
  typeof SearchResultsWithContentSchema
>;

export type DocumentPreview = {
  id: string;
  title: string | null;
  url?: string | null;
  contentPreview?: string | null;
};

export type MessagesReducerAction =
  | ['push', ConversationMessage]
  | ['update', ConversationMessage]
  | ['updateContent', { id: string; token: string }];

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
  }
};
