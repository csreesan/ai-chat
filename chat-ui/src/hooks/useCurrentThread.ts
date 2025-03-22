import { createContext, useContext } from 'react';

export const CurrentThreadContext = createContext<{
  threadId: string | null;
  setThreadId: (threadId: string | null) => void;
}>({
  threadId: null,
  setThreadId: () => {},
});

export function useCurrentThread() {
  return useContext(CurrentThreadContext);
} 