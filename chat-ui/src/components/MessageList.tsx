import { MODEL_INFO } from '../constants/models';
import styles from './MessageList.module.css';
import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { DisplayChatMessage } from '../types/types';
interface MessageListProps {
  messages: DisplayChatMessage[];
}

const MessageList = ({ messages }: MessageListProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
                <div className={styles.aiModel}>
                  From: {MODEL_INFO[m.model as keyof typeof MODEL_INFO].displayName}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default MessageList;