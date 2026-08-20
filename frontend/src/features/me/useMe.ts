import { useQuery } from '@tanstack/react-query';
import { getMe } from './meApi';

export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: getMe });
}
