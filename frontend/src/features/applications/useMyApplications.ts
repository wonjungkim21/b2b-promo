import { useQuery } from '@tanstack/react-query';
import { getMyApplications } from './applicationsApi';

export function useMyApplications() {
  return useQuery({ queryKey: ['myApplications'], queryFn: getMyApplications });
}
