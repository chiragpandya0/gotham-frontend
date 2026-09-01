import { useSyncExternalStore } from 'react'
import { authStore } from '../state/authStore'

export function useAuthSignedIn(): boolean {
  return useSyncExternalStore(authStore.subscribe, authStore.get, authStore.get)
}
