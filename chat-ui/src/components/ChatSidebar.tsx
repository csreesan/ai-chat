import React, { useState, useEffect } from 'react';
import styles from './ChatSidebar.module.css';
import { getThreads, Thread as ThreadType, ChatMessage, getChatMessages } from '../client';
import { useCurrentThread } from '../CurrentThreadContext';
import { ChatThread } from '../types/types';

// Add props interface
interface ChatSidebarProps {
  setMessages: (messages: ChatMessage[]) => void;
  threads: ChatThread[];
  setThreads: (threads: ChatThread[] | ((prevThreads: ChatThread[]) => ChatThread[])) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ setMessages, threads, setThreads }) => {
  const { threadId, setThreadId } = useCurrentThread();

  useEffect(() => {
    const fetchThreadsAndInitiateEmptyConversation = async () => {
      const response = await getThreads();
      if (response.data) {
        const threadsData: ChatThread[] = response.data.map((thread: ThreadType) => ({
          id: thread.id,
          name: thread.name,
          created_at: thread.created_at,
          isActive: false
        }));
        setThreads(threadsData);
        // Create a new thread placeholder to start an empty conversation
        // similar to ChatGPT if no thread is selected.
        if (threadId === null) {
          createNewThread();
        } else {
          handleThreadSelect(threadId, threadsData);
        }
      } else {
        console.error(response.error);
      }
    };
    fetchThreadsAndInitiateEmptyConversation();
  }, []);

  const [isOpen, setIsOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const createNewThread = (): void => {
    const newThread: ChatThread = {
      id: null,
      name: "New conversation",
      created_at: new Date().toISOString(),
      isActive: true
    };
    
    // Set all threads to inactive and make the new one active
    setThreads(prevThreads => [newThread, ...prevThreads.map(thread => ({...thread, isActive: false}))]);
    setThreadId(null);
    setMessages([]);  
  };

  const fetchMessages = async (id: string | null): Promise<void> => {
    if (id === null) {
      return;
    }
    const response = await getChatMessages({ path: { thread_id: id } });
    if (response.data) {
      setMessages(response.data);
    } else {
      console.error(response.error);
    }
  };

  // Handle thread selection
  // allow fetch threads optional to be passed in for when it's in the same render cycle
  const handleThreadSelect = (id: string, fetchedThreads?: ChatThread[]): void => {
    const threadList = fetchedThreads || threads;
    const selectedThread = threadList.find(thread => thread.id === id);
    if (!selectedThread) {
      console.error(`Attempted to select non-existent thread with ID: ${id}`);
      setThreadId(null);
      createNewThread();
      return;
    }

    const otherThreads = threadList.filter(thread => thread.id !== id && thread.id !== null);
    const updatedThreads = [
      { ...selectedThread, isActive: true },
      ...otherThreads.map(thread => ({ ...thread, isActive: false }))
    ];
    
    setThreads(updatedThreads);
    setThreadId(id);

    fetchMessages(id);
  };
  
  // Filter threads based on search query
  const filteredThreads = threads.filter(thread => 
    thread.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className={`${styles.chatSidebar} ${isOpen ? styles.open : styles.closed}`}>
      {/* Toggle button */}
      <button 
        className={styles.sidebarToggle}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '←' : '→'}
      </button>
      
      {isOpen && (
        <div className={styles.sidebarContent}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarHeaderTitle}>Chats</h2>
            <button 
              className={styles.newChatButton} 
              onClick={() => createNewThread()}
              disabled={threadId === null}
            >
              + New Chat
            </button>
          </div>
          
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          
          <div className={styles.threadsList}>
            {filteredThreads.length > 0 ? (
              filteredThreads.map(thread => (
                <div 
                  key={thread.id}
                  className={`${styles.threadItem} ${thread.isActive ? styles.active : ''}`}
                  onClick={() => handleThreadSelect(thread.id!)}
                >
                  <div className={styles.threadContent}>
                    <div className={styles.threadTitle}>{thread.name}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.noResults}>No conversations found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatSidebar;