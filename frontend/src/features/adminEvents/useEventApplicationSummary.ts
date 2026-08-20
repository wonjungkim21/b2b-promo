import { useQuery } from '@tanstack/react-query';
import { getEventApplicationSummary } from './adminEventsApi';

export function useEventApplicationSummary(id: number) {
  return useQuery({
    queryKey: ['adminEventSummary', id],
    queryFn: () => getEventApplicationSummary(id),
    enabled: !Number.isNaN(id),
  });
}
