import { useState } from 'react'
import { ViewProvider } from '../../state/viewStore'
import type { Me } from '../../types/domain'
import { useEventStream } from '../../hooks/useEventStream'
import { useAlertsLiveSync } from '../../hooks/useAlertsLiveSync'
import { useCameraHealthLiveSync } from '../../hooks/useCameraHealthLiveSync'
import { useAlertToastSync } from '../../hooks/useAlertToastSync'
import { TopBar } from './TopBar'
import { Rail } from './Rail'
import { Stage } from './Stage'
import { Sidebar } from './Sidebar'
import { Toast } from './Toast'
import { MessageToast } from './MessageToast'

export function Shell({ me }: { me: Me }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEventStream()
  useAlertsLiveSync()
  useCameraHealthLiveSync()
  useAlertToastSync()

  return (
    <ViewProvider>
      <div className="shell">
        <TopBar me={me} />
        <div className={`body${sidebarCollapsed ? ' side-collapsed' : ''}`}>
          <Rail />
          <Stage />
          <Sidebar collapsed={sidebarCollapsed} onToggleCollapsed={() => setSidebarCollapsed((v) => !v)} />
        </div>
        <Toast />
        <MessageToast />
      </div>
    </ViewProvider>
  )
}
