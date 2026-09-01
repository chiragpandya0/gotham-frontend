import { ViewProvider } from '../../state/viewStore'
import type { Me } from '../../types/domain'
import { IdStrip } from './IdStrip'
import { TopBar } from './TopBar'
import { Rail } from './Rail'
import { Stage } from './Stage'
import { Sidebar } from './Sidebar'
import { QueryBar } from './QueryBar'

export function Shell({ me }: { me: Me }) {
  return (
    <ViewProvider>
      <div className="shell">
        <IdStrip
          classification={me.classification ?? 'RESTRICTED'}
          instance={me.instance ?? 'Unified CCTV Grid, statewide instance'}
        />
        <TopBar me={me} />
        <div className="body">
          <Rail />
          <Stage />
          <Sidebar />
        </div>
        <QueryBar />
      </div>
    </ViewProvider>
  )
}
