export interface Profile {
  id: string;
  email: string;
  credits_limit: number;
  credits_used: number;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_used?: number;
  created_at: string;
}

export interface ChatRequestBody {
  conversationId: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  userId?: string;
  userEmail?: string;
}

export interface ChatQuotaErrorResponse {
  error: string;
  credits_used: number;
  credits_limit: number;
  code: 'QUOTA_EXCEEDED';
}
