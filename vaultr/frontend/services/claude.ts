import api from './api';
import type { ChatMessage } from '../types';

export async function sendChatMessage(message: string): Promise<ChatMessage> {
  const { data } = await api.post<ChatMessage>('/assistant/chat', { message });
  return data;
}

export async function getChatHistory(): Promise<ChatMessage[]> {
  const { data } = await api.get<ChatMessage[]>('/assistant/history');
  return data;
}
