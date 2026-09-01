import { useSyncExternalStore } from 'react'
import { metaBus } from '../lib/metaBus'
import type { Meta } from '../types/api'

export function useQueryBarMeta(): Meta | null {
  return useSyncExternalStore(metaBus.subscribe, metaBus.getLatest, metaBus.getLatest)
}
