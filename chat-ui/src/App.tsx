import { useState, } from 'react';
import MessageList from './components/MessageList';
import TextInput from './components/TextInput';
import { useChatMessages } from './hooks/useChatMessage';
import './App.css';
import ChatSidebar from './components/ChatSidebar';
import styles from './Apps.module.css';
import CurrentThreadProvider from './CurrentThreadContext';
import { client } from './client/client.gen';
import { ChatThread, DisplayChatMessage } from './types/types';
client.setConfig({
  baseUrl: import.meta.env.VITE_API_URL || 'https://chat.chrissreesangkom.com/api',
});

function App() {
  const [messages, setMessages] = useState<DisplayChatMessage[]>([]);
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
  messages: DisplayChatMessage[]; 
  setMessages: React.Dispatch<React.SetStateAction<DisplayChatMessage[]>>; 
  threads: ChatThread[];
  setThreads: React.Dispatch<React.SetStateAction<ChatThread[]>>;
}) {
  const { addMessage, compareMessages, isLoading, error } = useChatMessages(setMessages, setThreads);
  
  return (
    <>
      <ChatSidebar setMessages={setMessages} threads={threads} setThreads={setThreads} />
      <MessageList messages={messages} setMessages={setMessages} />
      {error && <div className={styles.errorMessage}>{error}</div>}
      <div className={styles.inputArea}>
        <TextInput onSubmit={addMessage} onCompareSubmit={compareMessages} disabled={isLoading} />
      </div>
    </>
  );
}

export default App;