import { useQuery } from '@tanstack/react-query';
import { PlayerLevel } from '@shared/schema';

interface FetchPlayerLevelOptions {
  enabled?: boolean;
}

export function usePlayerLevel(options: FetchPlayerLevelOptions = {}) {
  const { 
    data: playerLevel, 
    isLoading, 
    isError,
    error,
    refetch 
  } = useQuery<PlayerLevel>({
    queryKey: ['/api/player/level'],
    enabled: options.enabled !== false,
    retry: 1,
  });

  return {
    playerLevel,
    isLoading,
    isError,
    error,
    refetch
  };
}
