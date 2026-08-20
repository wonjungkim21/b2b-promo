import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEvent } from './adminEventsApi';

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}
