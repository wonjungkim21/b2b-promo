import { useMutation, useQueryClient } from '@tanstack/react-query';
import { applyToEvent, type ApplyPayload } from './eventsApi';

export function useApplyEvent(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApplyPayload) => applyToEvent(eventId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['events', eventId] });
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
    },
  });
}
