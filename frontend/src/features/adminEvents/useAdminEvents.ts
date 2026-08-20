import { useQuery } from '@tanstack/react-query';
import { getAdminEvents } from './adminEventsApi';

export function useAdminEvents() {
  return useQuery({ queryKey: ['adminEvents'], queryFn: getAdminEvents });
}
