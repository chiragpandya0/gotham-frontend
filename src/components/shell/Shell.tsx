import { useState } from 'react'
import { ViewProvider } from '../../state/viewStore'
import type { Me } from '../../types/domain'
import { IdStrip } from './IdStrip'
import { TopBar } from './TopBar'
import { Rail } from './Rail'
import { Stage } from './Stage'
import { Sidebar } from './Sidebar'
import { QueryBar } from './QueryBar'

export function Shell({ me }: { me: Me }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <ViewProvider>
      <div className="shell">
        <IdStrip
          classification={me.classification ?? 'RESTRICTED'}
          instance={me.instance ?? 'Unified CCTV Grid, statewide instance'}
        />
        <TopBar me={me} />
        <div className={`body${sidebarCollapsed ? ' side-collapsed' : ''}`}>
          <Rail />
          <Stage />
          <Sidebar collapsed={sidebarCollapsed} onToggleCollapsed={() => setSidebarCollapsed((v) => !v)} />
        </div>
        <QueryBar />
      </div>
    </ViewProvider>
  )
}
