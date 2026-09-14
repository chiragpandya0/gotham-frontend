import { useSyncExternalStore } from 'react'
import { messageToastStore } from '../state/messageToastStore'

export function useMessageToast(): string | null {
  return useSyncExternalStore(messageToastStore.subscribe, messageToastStore.get, messageToastStore.get)
}
