// types/chat.ts

export interface ChatThread {
  id: string;
  created_at: string;
  participants?: ChatParticipant[];
  last_message?: ChatMessage;
}

export interface ChatParticipant {
  id: string;
  thread_id: string;
  user_id: string;
  user?: {
    id: string;
    name: string;
    avatar_url?: string;
    is_ong?: boolean;
  };
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string | null;
  image_url?: string | null;
  created_at: string;
  sender?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export interface CreateMessageData {
  thread_id: string;
  sender_id: string;
  content?: string;
  image_url?: string;
}

export interface CreateThreadData {
  participant_ids: string[];
}