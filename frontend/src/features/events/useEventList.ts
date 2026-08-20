import { useQuery } from '@tanstack/react-query';
import { getEvents } from './eventsApi';

export function useEventList() {
  return useQuery({ queryKey: ['events'], queryFn: getEvents });
}
