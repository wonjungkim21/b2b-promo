import { useMutation } from '@tanstack/react-query';
import { signup } from './authApi';

export function useSignup() {
  return useMutation({ mutationFn: signup, retry: false });
}
