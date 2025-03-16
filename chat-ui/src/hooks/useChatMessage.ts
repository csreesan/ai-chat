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
      // Create a placeholder for the AI message
      const aiPlaceholder: ChatMessage = { content: '', role: 'ai' };
      setMessages((prev: ChatMessage[]) => [...prev, aiPlaceholder]);
      
      const response = await submitChatMessage({
        parseAs: 'stream',
        body: userMessage,
        path: { thread_id: currentThreadId! }
      });
      
      if (response.data && response.data instanceof ReadableStream) {
        // Handle streaming response
        const reader = response.data.getReader();
        let done = false;
        let accumulatedText = '';
        
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          
          if (value) {
            // Decode the Uint8Array to a string
            const text = new TextDecoder().decode(value);
            accumulatedText += text;
            
            // Update the AI message content with the full accumulated text
            setMessages((prev: ChatMessage[]) => {
              const updated = [...prev];
              updated[updated.length - 1].content = accumulatedText;
              return updated;
            });
          }
        }
      } else if (response.data) {
        // Handle non-streaming response (fallback)
        setMessages((prev: ChatMessage[]) => {
          // Replace the placeholder with the actual response
          const updated = [...prev];
          updated[updated.length - 1] = response.data!;
          return updated;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Remove the placeholder message on error
      setMessages((prev: ChatMessage[]) => prev.slice(0, -1));
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