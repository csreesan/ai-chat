import { useState, } from 'react';
import MessageList from './components/MessageList';
import TextInput from './components/TextInput';
import { useChatMessages } from './hooks/useChatMessage';
import './App.css';
import ChatSidebar from './components/ChatSidebar';
import styles from './Apps.module.css';
import CurrentThreadProvider from './CurrentThreadContext';
import { ChatMessage } from './client';
import { client } from './client/client.gen';
import { ChatThread } from './types/types';
client.setConfig({
  baseUrl: import.meta.env.VITE_API_URL || 'https://chat.chrissreesangkom.com/api',
});

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  
  return (
    <div className={styles.app}>
      <CurrentThreadProvider>
        <AppContent 
          messages={messages} 
          setMessages={setMessages} 
          threads={threads} 
          setThreads={setThreads} 
        />
      </CurrentThreadProvider>
    </div>
  );
}

function AppContent({ 
  messages, 
  setMessages, 
  threads, 
  setThreads 
}: { 
  messages: ChatMessage[]; 
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>; 
  threads: ChatThread[];
  setThreads: React.Dispatch<React.SetStateAction<ChatThread[]>>;
}) {
  const { addMessage, isLoading, error } = useChatMessages(setMessages, setThreads);
  
  return (
    <>
      <ChatSidebar setMessages={setMessages} threads={threads} setThreads={setThreads} />
      <MessageList messages={messages} />
      {error && <div className={styles.errorMessage}>{error}</div>}
      <div className={styles.inputArea}>
        <TextInput onSubmit={addMessage} disabled={isLoading} />
      </div>
    </>
  );
}

export default App;