import { ChatMessage } from '../client';
import styles from './MessageList.module.css';
import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

interface MessageListProps {
  messages: ChatMessage[];
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
        <div 
          key={index} 
          className={msg.role === 'user' ? styles.userMessage : styles.aiMessage}
        >
          <ReactMarkdown 
          >
            {msg.content}
          </ReactMarkdown>
        </div>
      ))}
    </div>
  );
};

export default MessageList;