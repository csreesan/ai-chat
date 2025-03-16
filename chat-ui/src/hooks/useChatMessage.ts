import { useState } from 'react';
import { submitChatMessage, ChatMessage, createThread } from '../client';
import { useCurrentThread } from '../CurrentThreadContext';
import { ChatThread } from '../types/types';

export const useChatMessages = (
  setMessages: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void,
  setThreads: (threads: ChatThread[] | ((prevThreads: ChatThread[]) => ChatThread[])) => void,
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { threadId, setThreadId } = useCurrentThread();

  const addMessage = async (text: string) => {
    
    // Send to API and add AI response
    setIsLoading(true);
    setError(null);

    var currentThreadId = threadId;

    if (currentThreadId === null) {
      // Create a new thread if no thread is selected
      const response = await createThread();
      if (response.data) {
        const newThreadId = response.data.id;
        setThreadId(newThreadId);
        currentThreadId = newThreadId;
        setThreads((prevThreads: ChatThread[]) => {
          prevThreads[0].id = currentThreadId;
          prevThreads[0].name = response.data.name;
          return prevThreads;
        });
      }
    }
    const userMessage: ChatMessage = { content: text, role: 'user' };
    setMessages((prev: ChatMessage[]) => [...prev, userMessage]);

    try {
      const response = await submitChatMessage({
        body: userMessage,
        path: { thread_id: currentThreadId! }
      });
      if (response.data) {
        setMessages((prev: ChatMessage[]) => [...prev, response.data!]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    addMessage,
    isLoading,
    error
  };
};