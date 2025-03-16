import { createContext, useContext, useState } from 'react';

const CurrentThreadContext = createContext<{
  threadId: string | null;
  setThreadId: (threadId: string | null) => void;
}>({
  threadId: null,
  setThreadId: () => {},
});

export function CurrentThreadProvider({ children }: { children: React.ReactNode }) {
  const [threadId, setThreadId] = useState<string | null>(null);
  return (
    <CurrentThreadContext.Provider value={{ threadId, setThreadId }}>
      {children}
    </CurrentThreadContext.Provider>
  );
}

export function useCurrentThread() {
  return useContext(CurrentThreadContext);
}
