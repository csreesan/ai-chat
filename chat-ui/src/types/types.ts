import { ChatMessage, Role } from '../client/types.gen';
export interface ChatThread {
  id: string | null;
  name: string;
  created_at: string;
  isActive: boolean;
}

export type DisplayChatMessage = {
  messages: ChatMessage[];
  role: Role;
}