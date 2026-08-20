import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateEventStatus } from './adminEventsApi';

export function useUpdateEventStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: '예정' | '진행중' | '종료' }) =>
      updateEventStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}
