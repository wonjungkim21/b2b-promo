import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateEvent, type EventFormPayload } from './adminEventsApi';

export function useUpdateEvent(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: EventFormPayload) => updateEvent(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
      queryClient.invalidateQueries({ queryKey: ['events', id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}
