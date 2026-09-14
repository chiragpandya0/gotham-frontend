import { useMessageToast } from '../../hooks/useMessageToast'
import { messageToastStore } from '../../state/messageToastStore'

export function MessageToast() {
  const message = useMessageToast()

  return (
    <div className={message ? 'toast show' : 'toast'} id="msgToast">
      <div className="l1">{message}</div>
      <div className="l3">
        <button onClick={() => messageToastStore.dismiss()}>Dismiss</button>
      </div>
    </div>
  )
}
