import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import type { Camera } from '../../types/domain'
import { usePreviewSessions } from '../../hooks/usePreviewSessions'

interface CameraPreviewPlayerProps {
  camera: Camera
}

// Ports buildPlayer() (unified-grid-v2.html ~line 5047), scoped to HLS
// playback only per the agreed v1 scope — WebRTC/WHEP is a stretch goal.
export function CameraPreviewPlayer({ camera }: CameraPreviewPlayerProps) {
  const { canOpen, start, stop, open } = usePreviewSessions()
  const isOpen = open.has(camera.id)
  const [state, setState] = useState<'idle' | 'connecting' | 'live' | 'error'>('idle')
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)

  const hlsUrl = camera.stream?.hls_url

  useEffect(() => {
    if (!isOpen) {
      setState('idle')
      return
    }
    const video = videoRef.current
    if (!video || !hlsUrl) {
      setState('error')
      return
    }

    setState('connecting')
    if (Hls.isSupported()) {
      const hls = new Hls()
      hlsRef.current = hls
      hls.loadSource(hlsUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setState('live')
        video.play().catch(() => {})
      })
      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (data.fatal) setState('error')
      })
      return () => {
        hls.destroy()
        hlsRef.current = null
      }
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl
      video.addEventListener('loadedmetadata', () => setState('live'))
      video.play().catch(() => {})
    } else {
      setState('error')
    }
  }, [isOpen, hlsUrl])

  function onStart() {
    if (!canOpen(camera.id)) return
    start(camera.id)
  }
  function onStop() {
    stop(camera.id)
  }

  const atCap = !canOpen(camera.id)

  return (
    <div className="player">
      <div className="pstage">
        <div className={isOpen && state !== 'error' ? 'screen' : 'screen idle'}>
          {!isOpen && (
            <div className="idlebox">
              <p>Preview is off</p>
              <s>
                Every viewer opens its own copy of the stream from {camera.adapter}. Nothing is pulled from this
                camera until you ask for it.
              </s>
              <button className="startbtn" disabled={atCap} onClick={onStart}>
                {atCap ? 'Session limit reached' : 'Start stream'}
              </button>
            </div>
          )}
          {isOpen && state === 'error' && (
            <div className="idlebox">
              <p>Stream not available</p>
              <s>
                {hlsUrl
                  ? 'The HLS source failed to load.'
                  : 'This camera has no HLS URL yet — probe it before requesting a preview.'}
              </s>
              <button className="startbtn" onClick={onStop}>
                Close
              </button>
            </div>
          )}
          {isOpen && state !== 'error' && (
            /* eslint-disable-next-line jsx-a11y/media-has-caption */
            <video ref={videoRef} muted playsInline style={{ width: '100%', height: '100%', background: '#000' }} />
          )}
        </div>
        <div className="pctl">
          <div className="proto">
            <button aria-pressed="true" disabled>
              HLS
            </button>
            <button aria-pressed="false" disabled title="Best-effort only in this build">
              WebRTC
            </button>
            <button aria-pressed="false" disabled title="Inference path, not browser playable">
              RTSP
            </button>
          </div>
          {isOpen && (
            <button className="stop" onClick={onStop}>
              Stop stream
            </button>
          )}
        </div>
      </div>

      <div className="pside">
        <div>
          <h6>Session</h6>
          <dl>
            <dt>Transport</dt>
            <dd>HLS</dd>
            <dt>Endpoint</dt>
            <dd style={{ fontSize: 10.5 }}>{hlsUrl ?? 'not reported'}</dd>
            <dt>State</dt>
            <dd>{isOpen ? state : 'idle'}</dd>
            <dt>Declared rate</dt>
            <dd>{camera.declared_fps ? `${camera.declared_fps} fps` : 'not reported'}</dd>
          </dl>
        </div>
        <div>
          <h6>Health, last 24 hours</h6>
          <dl>
            <dt>Reconnects</dt>
            <dd>{camera.health?.reconnects_24h ?? '—'}</dd>
            <dt>Decode errors</dt>
            <dd className={(camera.health?.decode_errors_24h ?? 0) > 100 ? 'warn' : undefined}>
              {camera.health?.decode_errors_24h ?? '—'}
            </dd>
          </dl>
        </div>
        <div>
          <h6>Last reads on this camera</h6>
          <div className="plast">
            {camera.recent_reads && camera.recent_reads.length > 0 ? (
              camera.recent_reads.slice(0, 4).map((r, i) => (
                <div key={i}>
                  <span className="pp">{r.plate_display}</span>
                  <span className="tt">{r.seen_time_str}</span>
                </div>
              ))
            ) : (
              <div className="cap">No reads in the selected window.</div>
            )}
          </div>
        </div>
        <div className="cap">Preview does not feed analytics. Detection runs at the edge whether anyone is watching or not.</div>
      </div>
    </div>
  )
}
