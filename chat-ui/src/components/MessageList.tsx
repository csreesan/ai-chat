import { MODEL_INFO } from '../constants/models';
import styles from './MessageList.module.css';
import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { DisplayChatMessage } from '../types/types';
import { submitChatMessageSelect } from '../client';
import { useCurrentThread } from '../hooks/useCurrentThread';
import { Model } from '../client/types.gen';

interface MessageListProps {
  messages: DisplayChatMessage[];
  setMessages: (messages: DisplayChatMessage[] | ((prev: DisplayChatMessage[]) => DisplayChatMessage[])) => void;
}

const MessageList = ({ messages, setMessages }: MessageListProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { threadId } = useCurrentThread();

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSelectVersion = async (compareMessageId: string, selectedModel: Model, messageIndex: number) => {
    if (!threadId) return;
    
    try {
      await submitChatMessageSelect({
        body: {
          comparison_message_id: compareMessageId,
          selected_model: selectedModel
        },
        path: { thread_id: threadId }
      });

      // Update the messages to keep only the selected version
      setMessages((prev: DisplayChatMessage[]) => {
        const updated = [...prev];
        const aiMessage = updated[messageIndex];
        // Keep only the selected model's message
        aiMessage.messages = aiMessage.messages.filter(m => m.model === selectedModel);
        // Remove the comparison_message_id to hide the button
        delete aiMessage.comparison_message_id;
        return updated;
      });
    } catch (error) {
      console.error('Error selecting version:', error);
    }
  };

  return (
    <div className={styles.chatContainer} ref={containerRef}>
      {messages.map((msg, index) => (
        <div key={index} className={msg.role === 'user' ? styles.userMessageContainer : styles.aiMessageContainer}>
          {msg.messages.map((m, i) => (
            <div 
              key={i} 
              className={`${m.role === 'user' ? styles.userMessage : styles.aiMessage}`}
            >
              <ReactMarkdown>
                {m.content}
              </ReactMarkdown>
              {m.role === 'ai' && (
                <>
                  <div className={styles.aiModel}>
                    From: {MODEL_INFO[m.model as keyof typeof MODEL_INFO].displayName}
                  </div>
                  {msg.messages.length > 1 && msg.comparison_message_id && (
                    <button 
                      className={styles.selectVersionButton}
                      onClick={() => handleSelectVersion(msg.comparison_message_id!, m.model as Model, index)}
                      disabled={msg.isLoading}
                    >
                      select this version
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default MessageList;