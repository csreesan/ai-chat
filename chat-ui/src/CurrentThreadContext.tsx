import { useState, useEffect } from 'react';
import { CurrentThreadContext } from './hooks/useCurrentThread';

export default function CurrentThreadProvider({ children }: { children: React.ReactNode }) {
  const [threadId, setThreadId] = useState<string | null>(() => {
    // Initialize from localStorage if available
    const storedThreadId = localStorage.getItem('currentThreadId');
    return storedThreadId || null;
  });

  // Update localStorage when threadId changes
  useEffect(() => {
    if (threadId) {
      localStorage.setItem('currentThreadId', threadId);
    } else {
      localStorage.removeItem('currentThreadId');
    }
  }, [threadId]);
 
  return (
    <CurrentThreadContext.Provider value={{ threadId, setThreadId }}>
      {children}
    </CurrentThreadContext.Provider>
  );
}
