import { useQuery } from '@tanstack/react-query';
import { HistoryItem } from '@/types';

export function useTournamentHistory() {
  const { 
    data: historyItems,
    isLoading,
    isError,
    error,
    refetch 
  } = useQuery<HistoryItem[]>({
    queryKey: ['/api/tournaments/history'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    historyItems: historyItems || [],
    isLoading,
    isError,
    error,
    refetch
  };
}

export function useTournamentSession(sessionId: string | null) {
  const { 
    data: session,
    isLoading,
    isError,
    error,
    refetch 
  } = useQuery<any>({
    queryKey: [`/api/sessions/${sessionId}`],
    enabled: !!sessionId,
  });

  return {
    session,
    isLoading,
    isError,
    error,
    refetch
  };
}
