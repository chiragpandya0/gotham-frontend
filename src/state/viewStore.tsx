import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export const VIEW_IDS = ['map', 'alerts', 'cams', 'det', 'trace', 'health', 'dept'] as const
export type ViewId = (typeof VIEW_IDS)[number]

interface ViewStoreValue {
  view: ViewId
  setView: (view: ViewId) => void
}

const ViewContext = createContext<ViewStoreValue | null>(null)

export function ViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ViewId>('map')
  const value = useMemo(() => ({ view, setView }), [view])
  return <ViewContext.Provider value={value}>{children}</ViewContext.Provider>
}

export function useView(): ViewStoreValue {
  const ctx = useContext(ViewContext)
  if (!ctx) throw new Error('useView must be used within a ViewProvider')
  return ctx
}
