import { useState } from 'react';
import { submitChatMessage, ChatMessage, createThread, Model, submitChatMessageCompare } from '../client';
import { useCurrentThread } from './useCurrentThread';
import { ChatThread, DisplayChatMessage } from '../types/types';

export const useChatMessages = (
  setMessages: (messages: DisplayChatMessage[] | ((prev: DisplayChatMessage[]) => DisplayChatMessage[])) => void,
  setThreads: (threads: ChatThread[] | ((prevThreads: ChatThread[]) => ChatThread[])) => void,
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { threadId, setThreadId } = useCurrentThread();

  const get_current_thread_id = async () => {
    let currentThreadId = threadId;

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
    return currentThreadId;
  }

  const addMessage = async (text: string, model: 'gpt-4o-mini' | 'gpt-4o' | 'claude-3-7-sonnet-20250219' | 'claude-3-5-sonnet-20241022') => {
    // Send to API and add AI response
    setIsLoading(true);
    setError(null);

    const currentThreadId = await get_current_thread_id();

    const userMessage: ChatMessage = { content: text, role: 'user' };
    setMessages((prev: DisplayChatMessage[]) => [...prev, { messages: [userMessage], role: 'user'}]);

    try {
      // Create a placeholder for the AI message
      const aiPlaceholder: ChatMessage = { content: '', role: 'ai', model: model };
      setMessages((prev: DisplayChatMessage[]) => [...prev, { messages: [aiPlaceholder], role: 'ai'}]);
      
      const response = await submitChatMessage({
        parseAs: 'stream',
        body: {
          content: userMessage.content,
          model: model,
        },
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
            setMessages((prev: DisplayChatMessage[]) => {
              const updated = [...prev];
              updated[updated.length - 1].messages[0].content = accumulatedText;
              return updated;
            });
          }
        }
      } else if (response.data) {
        // Handle non-streaming response (fallback)
        setMessages((prev: DisplayChatMessage[]) => {
          // Replace the placeholder with the actual response
          const updated = [...prev];
          updated[updated.length - 1].messages[0] = response.data!;
          return updated;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Remove the placeholder message on error
      setMessages((prev: DisplayChatMessage[]) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const compareMessages = async (text: string, models: Model[]) => {
    setIsLoading(true);
    setError(null);

    const currentThreadId = await get_current_thread_id();
    const userMessage: ChatMessage = { content: text, role: 'user' };
    setMessages((prev: DisplayChatMessage[]) => [...prev, { messages: [userMessage], role: 'user'}]);
    
    const model_to_message_index = Object.fromEntries(models.map((model, index) => [model, index]));
    
    try {
      // Create placeholders for the AI message
      const aiPlaceholders: ChatMessage[] = models.map((model) => ({ content: '', role: 'ai', model: model }));
      setMessages((prev: DisplayChatMessage[]) => [...prev, { messages: aiPlaceholders, role: 'ai', isLoading: true }]);
      
      const response = await submitChatMessageCompare({
        parseAs: 'stream',
        body: {
          content: userMessage.content,
          models: models,
        },
        path: { thread_id: currentThreadId! }
      });
      
      if (response.data && response.data instanceof ReadableStream) {
        // Handle streaming response
        const reader = response.data.getReader();
        let done = false;
        // Create a map to track accumulated content for each model
        const modelContentMap = Object.fromEntries(models.map(model => [model, '']));
        let compareMessageId = '';
        
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          
          if (value) {
            // Decode the Uint8Array to a string
            const text = new TextDecoder().decode(value);
            
            // Split the text by newlines to handle multiple JSON objects
            const lines = text.split('\n').filter(line => line.trim() !== '');
            
            for (const line of lines) {
              // Strip data: from the beginning of the string and trim all whitespace
              const text_without_data = line.replace('data: ', '').trim();
              
              // Skip empty messages
              if (!text_without_data) continue;
              
              try {
                const new_message = JSON.parse(text_without_data);
                if ('comparison_message_id' in new_message && new_message['comparison_message_id'] !== "") {
                  compareMessageId = new_message['comparison_message_id'];
                  setMessages((prev: DisplayChatMessage[]) => {
                    const updated = [...prev];
                    updated[updated.length - 1].comparison_message_id = compareMessageId;
                    return updated;
                  });
                  continue;
                }
                
                const model = new_message.model;
                const model_index = model_to_message_index[model];
                
                // Append the new content to our accumulated content for this model
                modelContentMap[model] += new_message.content;
                
                // Update the AI message with the accumulated content for this model
                setMessages((prev: DisplayChatMessage[]) => {
                  const updated = [...prev];
                  updated[updated.length - 1].messages[model_index].content = modelContentMap[model];
                  return updated;
                });
              } catch (parseError) {
                console.error('Failed to parse message:', parseError, 'Text was:', text_without_data);
              }
            }
          }
        }
        // Set loading to false when streaming is complete
        setMessages((prev: DisplayChatMessage[]) => {
          const updated = [...prev];
          updated[updated.length - 1].isLoading = false;
          return updated;
        });
      } else {
        console.error('NOT A STREAM');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Remove the placeholder message on error
      setMessages((prev: DisplayChatMessage[]) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    addMessage,
    compareMessages,
    isLoading,
    error
  };
};