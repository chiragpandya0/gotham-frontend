import L from 'leaflet'
import { type CartoStyle } from '../../lib/cartoTileUrl'

const STYLE_CYCLE: CartoStyle[] = ['voyager', 'dark', 'light']
const STYLE_LABEL: Record<CartoStyle, string> = { dark: 'Dark', light: 'Light', voyager: 'Voyager' }
const LAYERS_ICON =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">' +
  '<path d="M12 3 2 8l10 5 10-5-10-5Z"/>' +
  '<path d="m2 13 10 5 10-5" stroke-opacity="0.55"/>' +
  '<path d="m2 17.5 10 5 10-5" stroke-opacity="0.3"/>' +
  '</svg>'

// Cycles the CARTO basemap style on click; the button's title (a native
// tooltip) always names the currently-active style. Stacks directly under
// the zoom control since Leaflet appends same-corner controls in order.
export function createMapStyleControl(initialStyle: CartoStyle, onChange: (style: CartoStyle) => void) {
  let style = initialStyle
  const Control = L.Control.extend({
    options: { position: 'topleft' },
    onAdd(): HTMLElement {
      const container = L.DomUtil.create('div', 'leaflet-bar layers-bar')
      const button = L.DomUtil.create('a', '', container) as HTMLAnchorElement
      button.href = '#'
      button.setAttribute('role', 'button')
      button.innerHTML = LAYERS_ICON

      const setTitle = () => {
        button.title = `${STYLE_LABEL[style]} — click to switch`
      }
      setTitle()

      L.DomEvent.on(button, 'click', (e: Event) => {
        L.DomEvent.stop(e)
        style = STYLE_CYCLE[(STYLE_CYCLE.indexOf(style) + 1) % STYLE_CYCLE.length]!
        onChange(style)
        setTitle()
      })
      L.DomEvent.disableClickPropagation(container)

      return container
    },
  })
  return new Control()
}
