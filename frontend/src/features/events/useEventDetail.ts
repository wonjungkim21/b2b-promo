import { useQuery } from '@tanstack/react-query';
import { getEventDetail } from './eventsApi';

export function useEventDetail(id: number) {
  return useQuery({
    queryKey: ['events', id],
    queryFn: () => getEventDetail(id),
    enabled: !Number.isNaN(id),
  });
}
