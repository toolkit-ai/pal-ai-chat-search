export interface ConversationMessage {
  id: string;
  content: string;
  type: 'text' | 'search-results';
  role: 'user' | 'assistant' | 'system';
  feedback: MessageFeedback[];
  searchResultSet?: SearchResultsWithContent | null;
}

interface MessageFeedback {
  id: string;
  rating: Rating;
  content?: { text: string };
}

export enum Rating {
  ThumbsUp = 'thumbsUp',
  ThumbsDown = 'thumbsDown',
}

export interface SearchResultsWithContent {
  documents: DocumentPreview[];
  sections: Array<{
    id: string;
    heading: string | null;
    text: string;
    documentId: string;
    applicationId: string;
    indexOrder: number | null;
    indexId: string | null;
    indexName: string | null;
    indexInfo?: unknown;
  }>;
}

export type DocumentPreview = {
  id: string;
  title: string | null;
  url?: string | null;
  contentPreview?: string | null;
};
