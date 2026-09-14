// A request to jump the Map view to the "Cameras" layer and frame one or
// more cameras — fired from the Cameras registry's "View on map"/row "Map"
// buttons, mirroring how tracePlateStore drives the Map view's Route layer.
// `token` increments on every call so MapView can tell two requests for the
// same camera(s) apart and re-apply the focus each time.
export interface MapFocusRequest {
  cameraIds: number[]
  token: number
}

type Listener = (request: MapFocusRequest) => void

const listeners = new Set<Listener>()
let nextToken = 1
let request: MapFocusRequest | null = null

export const mapFocusStore = {
  focus(cameraIds: number[]) {
    request = { cameraIds, token: nextToken++ }
    for (const l of listeners) l(request)
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  get(): MapFocusRequest | null {
    return request
  },
}
