# Gotham Sentinel UI Theme Specification

Status: **draft, built step by step**. Each part is reviewed before the next is written.

| Part | Topic | Status |
|------|-------|--------|
| 1 | Foundations: principles, color, typography, shape, density | Done (decisions confirmed) |
| 2 | App shell: rail, top bar, page header, right panel, drawers, toasts | Done |
| 3 | Core components: buttons, inputs, dropdowns, tables, chips, tabs, bars, dialogs, toasts | Done |
| 4 | Pages: Map, Alerts, Watchlist, Cameras, Detections, Trace, Health, Departments, Sign-in | Draft |
| 5 | Map styling: base tiles, markers, overlays, popups | Todo |
| 6 | Migration plan: token mapping from the old `app.css`, order of work | Todo |

**Visual preview:** open [ui-theme-preview.html](ui-theme-preview.html) in a browser to see the real colors, type, chips, buttons and a list. Markdown can't render color, so the swatches live there.

References: 5 screenshots of a dark, dense, analyst-style workspace (Object Explorer, Chat, Graph, Video tagging, Map). Every rule below traces back to something visible in them.

---

## 1. Foundations

### 1.1 Design principles

What the references have in common, and what we copy:

1. **Dark neutral, not dark colored.** Surfaces are near-black charcoal with a faint blue cast. The current app uses a teal-navy (`#0e1a24`); the new one is more neutral and darker.
2. **Color means something.** Surfaces are gray. Color appears only for state: blue for the selected or primary item, amber for selection and warnings, red for danger or hostile, green for ok or live, cyan for the traced item.
3. **Dense and compact.** Small type (12–13px), tight rows (24–30px), 1px dividers instead of gaps or shadows. Lots of information per screen.
4. **Flat.** No gradients, no glows, and almost no shadows (floating layers only). Depth comes from surface lightness steps and 1px borders.
5. **Structure through panels.** Left icon rail, content in the middle, a right inspector panel. Panels are separated by 1px lines. Panel headers are small, uppercase, letter-spaced labels.
6. **Data is the star.** The map, video, graph and tables get the space. Chrome stays quiet and gray so the data colors stand out.
7. **Sharp corners.** 2px radius on nearly everything. Nothing is pill-shaped except small status chips.

### 1.2 Color tokens

All colors are CSS custom properties on `:root`. Components never use raw hex values.

#### Surfaces (darkest to lightest)

| Token | Hex | Used for |
|-------|-----|----------|
| `--bg-0` | `#0b0e11` | Page behind everything, map letterbox, video background |
| `--bg-1` | `#111418` | App background, main content area, table body |
| `--bg-2` | `#1c2127` | Panels: sidebar, inspector, drawers, top bar, cards |
| `--bg-3` | `#252a31` | Raised items inside panels: input fields, card headers, table header, menus |
| `--bg-4` | `#2f343c` | Hover state on `--bg-2`/`--bg-3` items |
| `--bg-5` | `#383e47` | Pressed state, active tab background, scrollbar thumb hover |

#### Borders

| Token | Hex | Used for |
|-------|-----|----------|
| `--border-subtle` | `#252a31` | Row dividers in tables and lists |
| `--border` | `#2f343c` | Panel edges, input borders, card borders |
| `--border-strong` | `#404854` | Focused-adjacent emphasis, dropdown menus, dialog edges |

#### Text

| Token | Hex | Used for |
|-------|-----|----------|
| `--text` | `#f6f7f9` | Titles, values, active labels |
| `--text-2` | `#abb3bf` | Body text, table cells, default labels |
| `--text-3` | `#738091` | Hints, placeholders, section labels, timestamps, disabled text |
| `--text-link` | `#8abbff` | Links, clickable entity names (like blue underlined names in the screenshots) |

#### Accent and state colors

Each hue has a **base** (fills, borders, icons), a **hover/bright** (text on dark, hover) and a **tint** (translucent background for chips, selected rows).

| Meaning | Base | Bright | Tint (bg) | Used for |
|---------|------|--------|-----------|----------|
| **Primary / selected** (blue) | `#2d72d2` | `#4c90f0` | `rgba(76,144,240,.16)` | Primary buttons, selected rows and nav items, active tab underline, histogram bars (`#8abbff` at 85%), focus ring |
| **Warning / watchlist** (amber) | `#c87619` | `#ec9a3c` | `rgba(236,154,60,.14)` | Watchlist hits, warnings, map selection box, pending status |
| **Danger / critical** (red) | `#cd4246` | `#e76a6e` | `rgba(231,106,110,.14)` | Critical alerts, destructive buttons, errors, offline-hostile zones on the map |
| **Success / live** (green) | `#238551` | `#32a467` | `rgba(50,164,103,.16)` | Live stream dot, "ready"/"online" chips, approved |
| **Trace** (cyan) | `#12b5cb` | `#3dcce0` | `rgba(61,204,224,.14)` | Traced vehicle, route lines, trace panel highlights |

Rules:
- A screen should show **at most three** accent hues at once besides blue. If everything is colored, nothing is.
- Text on a tint uses the **bright** value. Text on a solid base uses `--text`.
- The old tokens map as: `--signal` → amber, `--crit` → red, `--trace` → cyan, `--live` → green. Same semantics, new values. This keeps the migration mechanical (see Part 6).

#### Top status line

The screenshots show a 2px colored line along the very top of the window (green). We keep it as the app-level connection indicator: green when the event stream is live, amber when reconnecting, red when disconnected. Height 2px, full width, above the top bar.

### 1.3 Typography

| Token | Value |
|-------|-------|
| `--sans` | `'Inter', 'IBM Plex Sans', -apple-system, 'Segoe UI', Roboto, sans-serif` |
| `--mono` | `'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace` (plates, IDs, coordinates, timestamps, durations) |

Inter is a proposed switch: the references use a clean, slightly condensed grotesque, and Inter is the closest freely available match. IBM Plex Sans stays as the fallback so nothing breaks if the font isn't loaded. Decision needed (see section 1.7).

| Role | Size / weight / extras | Example |
|------|------------------------|---------|
| Page / panel title | 16px / 600 / `--text` | "Results", "Private Update Channel" |
| Section label | 11px / 600 / uppercase / letter-spacing `.08em` / `--text-3` | "OBJECT PROPERTIES", "PROPERTY VALUES", "ASSETS" |
| Body / table cell | 13px / 400 / `--text-2` | rows, descriptions |
| Emphasized value | 13px / 500 / `--text` | selected row, names |
| Small / meta | 12px / 400 / `--text-3` | timestamps, counts, helper text |
| Mono data | 12px / 400 / `--mono` | plates, camera IDs, lat/lng |
| Button label | 13px / 500 | all buttons |

Line height: 1.4 for body, 1.2 for titles. Numbers in tables and counts use `font-variant-numeric: tabular-nums` so columns line up.

### 1.4 Spacing and density

Base unit **4px**. Allowed steps: 4, 8, 12, 16, 24.

| Token | Value | Used for |
|-------|-------|----------|
| `--row-h` | 28px | Table rows, list items, tree/property rows |
| `--row-h-lg` | 36px | Cards in a queue (alerts, watchlist), nav items |
| `--control-h` | 30px | Buttons, inputs, dropdowns |
| `--control-h-sm` | 24px | Inline controls, chips, toolbar buttons |
| `--topbar-h` | 40px | Top bar |
| `--rail-w` | 48px | Left icon rail (down from 58px) |
| `--inspector-w` | 340px | Right panel (unchanged) |
| `--pad-panel` | 12px | Inner padding of panels and drawers |

### 1.5 Shape, borders, elevation

| Token | Value | Used for |
|-------|-------|----------|
| `--radius` | 2px | Buttons, inputs, cards, panels, chips, tooltips |
| `--radius-lg` | 4px | Dialogs, popovers, menus |
| `--radius-full` | 999px | Status dots and count badges only |
| Border width | 1px everywhere | No 2px borders except the focus ring and the top status line |

Elevation: only **floating** layers have a shadow.

| Layer | Shadow |
|-------|--------|
| Dropdown, menu, popover, tooltip | `0 4px 12px rgba(0,0,0,.5)` plus `--border-strong` border |
| Dialog, drawer | `0 8px 24px rgba(0,0,0,.6)` |
| Panels, cards, tables | None |

Backdrop for dialogs: `rgba(5,7,9,.7)`.

### 1.6 States (apply to every interactive element)

| State | Treatment |
|-------|-----------|
| Hover | Background steps up one surface level (`--bg-2` → `--bg-4`), text goes to `--text` |
| Active / pressed | Background `--bg-5` |
| Selected | Blue tint background plus a 2px left bar in `#4c90f0` (lists and nav) or blue bottom border (tabs). Text `--text`. Matches the highlighted "Marital Status" row and active "Properties" tab |
| Focus-visible | 2px outline `#4c90f0`, offset 1px. Never removed |
| Disabled | 40% opacity, no hover change, `not-allowed` cursor |
| Loading | Skeleton rows in `--bg-3`, no spinners except inside buttons |

Motion: 120ms ease-out for color/background changes, 200ms for panel slides. No bounces. Respect `prefers-reduced-motion`.

### 1.7 Decisions (confirmed)

1. **Font:** Inter for UI text, IBM Plex Mono for data. The preview page loads both so you can see them.
2. **Theme modes:** dark only. A light theme gets its own separate document later.
3. **Primary color:** blue. Cyan is reserved for the traced vehicle only.
4. **Rail:** icon-only, 48px, with tooltips (already icon-only today, so this is a restyle).
5. **Window/tab bar:** no multi-app taskbar. See the recommendation in Part 2, section 2.3.

### 1.8 Product name and logo

The product is **Gotham Sentinel**. Two forms, each with one job:

| Form | Where | Spec |
|------|-------|------|
| **Logo lockup: GOTHAM │ Sentinel** | Top bar, sign-in page | "GOTHAM" uppercase, 600 weight, letter-spacing `.2em`, `--text`. A 1px `--border` vertical divider with 10px padding each side. "Sentinel" in normal case, 500 weight, `--text-2`. Top bar: 13px. Sign-in: 26px, centered above the card (see 4.9) |
| **Written name: Gotham Sentinel** | Browser tab title, exports and report headers, emails, tooltips, any sentence naming the product | Plain text, normal case |

Rules: the lockup is never recolored (always `--text` and `--text-2`), never stacked, and never shown with the old name "Unified Grid" or "Unified CCTV Grid". The old tagline "vehicle trace and alerting" is dropped from the top bar. No organisation name or crest appears anywhere in the shell or on the sign-in page.

Browser tab: `Gotham Sentinel`. With a view open: `Alerts · Gotham Sentinel`.

---

## 2. App shell

Mockup: [ui-theme-preview.html](ui-theme-preview.html), section "Part 2". Files affected: `Shell.tsx`, `TopBar.tsx`, `Rail.tsx`, `Stage.tsx`, `Sidebar.tsx`, `Drawer.tsx`, `Toast.tsx`, `AccountMenu.tsx`.

### 2.1 Layout

```
+--------------------------------------------------------------+
| 2px status line (green live / amber reconnecting / red down)  |
+--------------------------------------------------------------+
| Top bar 40px: brand | plate search | clock, stat, bell, user   |
+------+-------------------------------------------+-----------+
| Rail | Page header (title + tabs)                | Right     |
| 48px +-------------------------------------------+ panel     |
|      | Content (map / table / queue / ...)       | 340px     |
+------+-------------------------------------------+-----------+
```

Grid: `48px 1fr 340px`. The right panel collapses to 0 with a 200ms slide, as it does now. Whole shell is `100vh`, no body scroll. Each panel scrolls on its own.

### 2.2 Top bar

- Height 40px, background `--bg-2`, bottom border `--border`.
- Three zones in a grid (`1fr auto 1fr`):
  - **Left:** the logo lockup **GOTHAM │ Sentinel** (section 1.8), 13px. No tagline, no divider line after it.
  - **Center:** plate search. 26px tall field, `--bg-1` background, 1px `--border`, 2px radius. Inside: plate-type select (`--bg-3` tag), mono plate segments, and a **Search** button in primary blue (20px tall). The "Partial" checkbox sits to its right. Field focus: 2px blue outline.
  - **Right:** "cameras onboarded" stat (value in mono `--text`, label `--text-3`), clock (mono `--text-2`), notification bell, account avatar. 14px gaps.
- Notification bell: red count badge (`--red`, white 9px/600 text, pill) when there are unread items.
- Account avatar: 22px circle, `--bg-5` with initials. Menu opens as a dropdown (see Part 3).

### 2.3 Navigation: rail plus page headers (recommendation for question 5)

The reference taskbar of open apps fits a platform where users keep many windows open. Our app has 8 fixed views and no multi-window state, so a taskbar would add chrome without function. Instead we take the two things from the references that do fit:

1. **Left icon rail** for switching views (already how our app works).
2. **Page header with tabs** inside each view, like the "Results / Types / Properties / Links / Timeline" strip in the first reference. Each view gets a title and, where it makes sense, tabs for its sub-modes (for example Map: Live, Heatmap, Coverage gaps; Cameras: Registry, Adapters). Part 4 defines the tabs per page.

If you later want open-view tabs (several traces open at once), they would slot in between the top bar and the page header without changing anything else.

### 2.4 Left rail

- Width 48px, background `--bg-2`, right border `--border`.
- Items 48×36px, icon 18px, color `--text-3`.
- Hover: `--bg-4` background, icon `--text`.
- **Active:** `--blue-t` background, 2px inset left bar `#4c90f0`, icon `--text`.
- Tooltip on hover to the right: `--bg-3`, 1px `--border-strong`, 12px text, 4px radius, floating shadow, 300ms delay.
- Alerts item carries the active-alert count: red pill badge, top-right of the icon.
- Order (unchanged): Map, Alerts, Watchlist, Cameras, Detections, Trace, Health, Departments.
- Bottom group (new, pinned with a flex spacer): sidebar collapse toggle.

### 2.5 Page header

- Background `--bg-2`, bottom border `--border`, padding `10px 12px 0`.
- Title 16px/600 `--text`. Optional right-aligned actions (buttons from Part 3).
- Tabs row, 13px, 16px gap. Inactive `--text-3`. Active `--text` with a 2px bottom border `#4c90f0`. Hover `--text-2`.
- Count badges next to a tab label: 11px, `--bg-4` background, `--text-2`, 2px radius, 5px horizontal padding.
- Pages with no sub-modes show the title only (height about 44px).

### 2.6 Content area

- Background `--bg-1`. No outer padding for full-bleed views (map, trace map). 12px padding for table and form views.
- Map stage: `--bg-0` behind tiles.
- Panel inside the content area (for example a queue next to a detail pane): `--bg-2`, 1px `--border`, no shadow.

### 2.7 Right panel (live detections and mini-feeds)

- Width 340px, background `--bg-2`, left border `--border`.
- Header 36px: uppercase section label ("LIVE DETECTIONS") on the left, stream status dot on the right (green live, amber reconnecting, red down).
- Feed rows 36px tall, 1px `--border-subtle` divider. Plate in mono 12px/500 `--text`, camera and time in 11px `--text-3`.
- Watchlist hit row: `--amber-t` background with a 2px inset left bar in `#ec9a3c`.
- New-row arrival: 600ms fade from `--blue-t` to transparent. No slide animations.
- Hover: `--bg-4`.

### 2.8 Drawers (slide-in from right over the content area)

- Width 420px (560px for wide forms such as camera onboarding). Background `--bg-2`, left border `--border-strong`, dialog shadow.
- Header 44px: title 14px/600, close icon button on the right, bottom border `--border`.
- Body: 12px padding, scrolls. Footer pinned: 1px top border, right-aligned buttons (secondary, then primary).
- No dark overlay over the whole app. The drawer clips inside the stage (as it does today), and the stage behind it dims to 60% opacity.
- Slide 200ms ease-out.

### 2.9 Toasts

- Bottom-right, 320px wide, 8px gap. Background `--bg-3`, 1px `--border-strong`, 4px radius, floating shadow.
- Left color bar 3px by type: red (critical alert), amber (watchlist hit), green (success), blue (info).
- Title 13px/500 `--text`, body 12px `--text-2`, close button top-right. Auto-dismiss after 6s, critical stays until closed.

### 2.10 Sign-in screen

- Full-screen `--bg-0`. Centered 360px panel: `--bg-2`, 1px `--border`, 4px radius, 24px padding, dialog shadow.
- Brand and tagline at the top, then fields (Part 3 inputs), a full-width primary button. Error text in `--red-b` under the field. The 2px status line is hidden here.

### 2.11 Decisions (confirmed)

1. Tables use dividers only, no zebra striping.
2. No open-apps taskbar (see 2.3).
3. Icons: **Lucide** (confirmed).

### 2.12 Icons (Lucide)

Today there are 11 hand-drawn icons in [icons.tsx](../src/styles/icons.tsx), with mixed sizes (14, 15, 16px) and stroke widths (1.5, 1.6). The new theme needs a wider set (edit, delete, filter, refresh, export...) in one consistent style.

**Chosen: Lucide** (`lucide-react`, MIT, tree-shaken, stroke-based like the current icons). All icons 1.5px stroke, 24px grid, `currentColor`. Sizes: 18px rail, 16px buttons and inputs, 14px dense chips and table cells.

| Where | Current | Lucide |
|-------|---------|--------|
| Rail: Map | `IconMap` | `map` |
| Rail: Alerts | `IconAlert` | `triangle-alert` |
| Rail: Watchlist | `IconWatchlist` | `eye` |
| Rail: Cameras | `IconCam` | `cctv` |
| Rail: Detections | `IconDet` | `scan-line` |
| Rail: Trace | `IconTrace` | `route` |
| Rail: Health | `IconHealth` | `activity` |
| Rail: Departments | `IconDept` | `building-2` |
| Top bar: search | `IconSearch` | `search` |
| Top bar: bell | `IconBell` | `bell` |
| Sign-in SSO | `IconSso` | `key-round` |
| Panel collapse | text glyph | `panel-right-close` |
| Common actions | text glyphs | `x`, `filter`, `pencil`, `trash-2`, `plus`, `refresh-cw`, `download`, `settings` |

Alternative: **Blueprint icons** (`@blueprintjs/icons`, Apache-2.0). Closest to the reference screenshots (filled, 16px grid, slightly heavier). Best if you want a pixel-close match; worse if you later want lighter, thinner icons next to Inter text.

See the live comparison at the bottom of [ui-theme-preview.html](ui-theme-preview.html) (loads Lucide from the internet).

---

## 3. Core components

Mockups: [ui-theme-preview.html](ui-theme-preview.html), section "Part 3". Colors and sizes are tokens from Part 1. Hover, selected, focus and disabled behavior follows section 1.6.

### 3.1 Buttons

Height 30px (`--control-h`), 12px horizontal padding, 13px/500, 2px radius, 1px border. Icon (16px, 1.5 stroke) sits left of the label with a 4px gap.

| Variant | Background | Border | Text | Hover | Use |
|---------|-----------|--------|------|-------|-----|
| Primary | `--blue` | `--blue` | `--text` | `--blue-b` | One per view or dialog: Search, Save, Add |
| Secondary | `--bg-3` | `--border-strong` | `--text` | `--bg-4` | Default for everything else |
| Outline | transparent | `--blue-b` | `--blue-b` | `--blue-t` bg | Secondary emphasis |
| Ghost | transparent | transparent | `--text-2` | `--bg-4`, text `--text` | Toolbars, table row actions |
| Danger | `--red` | `--red` | `--text` | `--red-b` | Delete, disconnect. Always behind a confirm dialog |

Sizes: default 30px, **small** 24px (12px text, 8px padding). **Icon-only** buttons are square (30×30 or 24×24), need a tooltip, and are ghost or secondary. Disabled: 40% opacity. Loading: label replaced by a 14px spinner, width held fixed.

### 3.2 Form fields

- Label: 12px `--text-2`, 4px above the field. Helper text: 11px `--text-3`, 4px below.
- Input / textarea: 30px tall (textarea min 72px), `--bg-3` background, 1px `--border`, 2px radius, 8px padding, 13px `--text`. Placeholder `--text-3`.
- Hover: border `--border-strong`. Focus: 2px `#4c90f0` outline, offset 1px.
- Error: border `--red-b`, message in 11px `--red-b` replacing the helper text.
- Disabled: 40% opacity.
- **Checkbox:** 14px square, `--bg-3`, 1px `--border-strong`, checked fill `--blue` with a white tick.
- **Toggle:** 28×16 pill, off `--bg-5`, on `--blue`, 12px white knob. Used for enabled/disabled settings.
- **Plate input:** the segmented plate field keeps its segments, but each segment uses the input style above, mono 12px, with 2px gaps.
- Field spacing: 10px between fields, 16px between groups.

### 3.3 Dropdowns and menus

- Trigger looks like an input with a 14px chevron on the right.
- Menu: `--bg-3`, 1px `--border-strong`, 4px radius, floating shadow, 4px vertical padding, 4px gap below the trigger. Max height 280px, scrolls.
- Item: 28px tall, 10px padding, 13px `--text-2`. Hover `--bg-4`. Selected item: `--blue-t` with the 2px blue left bar. Optional 14px icon at left.
- Divider: 1px `--border`. Destructive item: text `--red-b`.
- Account menu, row action menus and the plate-type select all use this one style.

### 3.4 Tables

- Container: no outer border radius, 1px `--border` around only when inside a card. Header row sticks to the top.
- Header: 28px, `--bg-3`, 11px/600 uppercase, letter-spacing `.08em`, `--text-3`, bottom border `--border`. Sortable columns show a 12px chevron on hover and a `--text` label when sorted.
- Rows: 28px (`--row-h`), 13px `--text-2`, 1px `--border-subtle` bottom divider, **no zebra striping**. 10px cell padding.
- Hover: `--bg-4`, text `--text`. Selected: `--blue-t` plus the 2px blue bar on the first cell.
- Plates, IDs, coordinates: mono 12px. **Plates are shown dashed exactly as the backend sends them: `GJ-05-AB-1234`.** Segments the camera couldn't read show as `??` in `--text-3`, for example `GJ-05-??-1234`. Plain text in lists, tables, feeds and the search box. A plate graphic is used only in detail views. Numbers and times: right-aligned, tabular figures.
- Row actions appear as ghost icon buttons on hover, right-aligned.
- Empty state: centered 13px `--text-3` message with a 24px Lucide icon above, in the table body area. Loading: 6 skeleton rows in `--bg-3`.
- **Confidence bar:** 60×4px track `--bg-5`, fill `--blue-b`. Fill turns `--amber-b` under the warning threshold and `--red-b` under the critical one.
- Pagination: right-aligned in a 36px footer, ghost buttons, 12px `--text-3` count text.

### 3.5 Chips, badges and status

- **Chip:** 12px text, 1px/8px padding, 2px radius, tint background with bright text (see color table). Variants: selected (blue), watchlist (amber), critical (red), ready/online (green), traced (cyan), neutral (`--bg-4` on `--text-2`).
- Removable chip: neutral chip plus an 11px `x`.
- **Count badge:** 11px, `--bg-4`, `--text-2`, 5px padding, 2px radius. On the alerts rail item it turns into a red pill.
- **Status dot:** 8px circle, bright color of the state, optionally followed by a 12px label.

### 3.6 Tabs

Same as the page header tabs (2.5): 13px, 16px gap, active text `--text` with a 2px `#4c90f0` bottom border, inactive `--text-3`. A 1px `--border` line runs under the whole row. Used inside drawers and detail panes too.

### 3.7 Panels, cards and detail lists

- **Panel / card:** `--bg-2`, 1px `--border`, 2px radius, no shadow. Card header 32px with a section label on the left and ghost icon actions on the right, divider below.
- **Queue item (alerts, watchlist):** 36px or taller, 12px padding, 1px `--border-subtle` divider. Selected: `--blue-t` with the blue bar. Severity shows as a 2px left bar (red critical, amber warning) when not selected.
- **Key-value list:** two columns, 110px label column in 12px `--text-3`, value 12px `--text`, 6px row gap. Used in drawers and detail panes.
- **Section label** above each group: 11px/600 uppercase `--text-3`, 24px above and 8px below.

### 3.8 Dialogs

- Centered, width 420px (560px for forms), `--bg-2`, 1px `--border-strong`, 4px radius, dialog shadow. Backdrop `rgba(5,7,9,.7)`.
- Header 44px: title 14px/600, close icon right, bottom border. Body 12px padding. Footer: top border, buttons right-aligned, Cancel (secondary) then the action (primary or danger).
- Confirm dialogs for destructive actions use a danger button and state exactly what will be removed.
- Esc closes. Focus is trapped. First focus goes to the safe action (Cancel) for destructive dialogs.

### 3.9 Tooltips

`--bg-3`, 1px `--border-strong`, 2px radius, 12px `--text`, 3px/8px padding, floating shadow. 300ms delay, max width 240px. Required on every icon-only button.

### 3.10 Toasts

Specified in 2.9; same tokens apply.

### 3.11 Scrollbars

8px wide, transparent track, thumb `--bg-5` (hover `#4a515b`), 4px radius. Applies to every scrolling panel.

### 3.12 Other widgets

- **Sparkline:** 1.5px line in `--blue-b`, no fill, no axes; the last point is a 3px dot. Threshold breach turns the line `--amber-b`.
- **Image / bbox viewer:** `--bg-0` background, detection box 2px `--blue-b` (watchlist hit: `--amber-b`), label chip in the same color on top-left.
- **Lightbox:** backdrop `rgba(5,7,9,.9)`, controls as ghost icon buttons on `--bg-2` at 80% opacity.
- **Skeleton:** `--bg-3` blocks with a slow 1.2s opacity pulse (disabled for reduced motion).

### 3.13 Open questions for Part 4

1. **Plate display:** show plates as a realistic plate graphic (like an Indian number plate), or as plain mono text everywhere (recommended for the dense look, with the graphic kept only in the detail view)?
2. **Severity colors in lists:** three levels (critical red, warning amber, info blue). Confirmed.

---

## 4. Pages

Mockups: [ui-theme-preview.html](ui-theme-preview.html), sections "Part 4.x". Pages are built only from the shell (Part 2) and components (Part 3). Where a page needs something new, it is listed here.

### 4.1 Map (`MapView.tsx`, `useLeafletMap.ts`, `StopsTimeline.tsx`)

**Page header:** title "Map overview". The Cameras / Route switch becomes a segmented control (below) instead of the current chip.

**Base map:** default style becomes **dark** (CARTO dark) so the map belongs to the theme. The existing style switcher (Voyager, Dark, Light, OpenStreetMap) stays, as a layers button under the zoom control. Content background behind tiles `--bg-0`.

**Map controls** (zoom, layers, attribution), restyled from Leaflet defaults:
- One stacked group at top-left: 28×28px buttons, `--bg-2`, 1px `--border-strong`, 2px radius, 1px gaps, 14px Lucide icons (`plus`, `minus`, `layers`) in `--text-2`, hover `--bg-4`.
- Attribution: bottom-right, 10px `--text-3` on `--bg-2` at 80% opacity.

**Mode switch** (Cameras | Route), top-right: segmented control, 26px tall, `--bg-2`, 1px `--border-strong`. Active segment `--blue-t` with a 2px blue bottom bar and `--text` label; inactive `--text-2`.

**Camera markers:** 12px circle, 2px `--bg-0` ring so they separate from the map, color by health:

| Health | Color |
|--------|-------|
| Live | `--green-b` |
| Degraded | `--amber-b` |
| Reconnecting / Down | `--red-b` |

Selected marker grows to 16px with a 2px white ring. Clusters (if used): `--bg-3` circle, 1px `--border-strong`, count in mono 12px `--text`.

**Camera popup:** `--bg-2`, 1px `--border-strong`, 4px radius, floating shadow, 190px wide. Title 13px/500 `--text` with a health chip, then camera ID and coordinates in 11px mono `--text-3`, then the latest plate (dashed, mono 12px `--text`) with its time. Replaces the light popup used today. Arrow tip in the same `--bg-2`.

**Legend:** bottom-left, `--bg-2` card, 11px text, three status dots with labels.

**Route mode:**
- Route line: 2.5px `--cyan-b`, round joins. Legs rejected by the kinematic check: 1.5px dashed `--text-3`.
- Stop markers: 12px `--cyan-b` circles, the latest stop white. Stop numbers shown in the timeline card.
- **Timeline card** (bottom-right, 260px): `--bg-2`, 1px `--border-strong`, 4px radius, floating shadow. Header has the plate (mono 13px/500 `--text`) and a cyan "Traced" chip. Stops are 26px rows: a 18px numbered circle (`--cyan-t` fill, 1px `--cyan` border, `--cyan-b` number), place name `--text-2`, time in mono `--text-3`. Hover `--bg-4`; click focuses the map. The old inverted "light card" variant goes away since the map is dark.

### 4.2 Alerts (`AlertsView.tsx`, `AlertQueue.tsx`, `AlertDetail.tsx`)

**Layout:** two columns, a 300px queue and a flexible detail pane, separated by a 1px `--border`. No page header (the queue has its own).

**Queue** (`--bg-2`):
- Header: "Alert queue" 14px/600 `--text`, with filter tabs under it (All, Open, Acknowledged, Dispatched) in the tab style from 3.6.
- Item (`--row-h-lg` or taller, 8px/12px padding, 1px `--border-subtle` divider):
  - line 1: plate (mono 12px/500 `--text`), time right-aligned (11px `--text-3`)
  - line 2: alert kind, 12px `--text-2`
  - line 3: priority chip, state chip, and the alert number (`#4821`, 11px `--text-3`) at the right
- **Severity bar:** 2px inset left bar: critical `--red-b`, high `--amber-b`, medium none.
- Hover `--bg-4`. Selected: `--blue-t` with the blue bar (replaces the severity bar while selected).

**Priority chips** (the three levels in your data): Critical = red, High = amber, Medium = blue.
**State chips:** Open = neutral, Acknowledged = blue, Dispatched = green.

**Detail pane:**
- **Header** (`--bg-2`, bottom border) has two zones, so navigation and actions are not mixed:
  - *Left, navigation:* the plate graphic, a 12px `--text-3` subtitle (kind, time, place), and under it two **text links** with 14px icons: "Show on map" (`map-pin`) and "Trace route" (`route`). Links use `--text-link`, 12px, 16px apart, underline on hover. They leave the page, so they look like links, not buttons.
  - *Right, actions on this alert:* **False positive** and **Escalate** (secondary), then **Dispatch** (primary). Small 26px buttons. Disabled actions stay visible at 40%.
  - Rule used across the app: **buttons change data, links go somewhere else.**
- **Body:** 12px padding, two-column grid of blocks with 12px gaps; blocks stack on narrow widths. Each block follows the card spec (3.7):
  - *Evidence:* the image with its detection box (2px `--amber-b`, label chip in the same color with plate and confidence), an expand button (ghost icon, top-right of the image), and a plate crop below.
  - *Registration:* key-value list (owner, make, colour, status; valid = `--green-b`, expired = `--red-b`).
  - *Location:* key-value list plus the small location map (dark tiles, one marker).
  - *Audit trail:* newest first, 12px rows with the time in mono `--text-3` (44px column) and the event text in `--text-2`.
- Failed action: inline error text in `--red-b` under the header, not a modal.

### 4.3 Watchlist (`WatchlistView.tsx`, `WatchlistQueue.tsx`, `WatchlistForm.tsx`)

**Layout:** same two-column pattern as Alerts: 300px queue, flexible form pane, 1px `--border` between.

**Queue header:** "Watchlist entries" 14px/600 with the total in 11px `--text-3`, and a **+ New entry** primary small button on the right (`plus` icon). Below: search field (26px, "Search plate…"), then the list filters as **wrapping chips** (All, Stolen vehicle, Wanted vehicle, Suspect vehicle, Missing person, Wanted person, Suspect person). Active chip is blue, others neutral. Chips replace the current button strip because there are seven of them and they wrap.

**Queue item:** line 1 plate (mono, dashed) and list name right-aligned (11px `--text-3`); line 2 the description in `--text-2`; line 3 priority chip, plus a neutral "Inactive" chip when the entry is off. Critical entries get the red left bar, high the amber bar. Selected: blue tint and bar. Priority colors are the same as Alerts.

**Form pane:**
- **Header:** plate graphic, subtitle ("Created 12 Jun by A. Shah · 3 matches") and on the right the **Active toggle** (toggle component with a green "Active" or gray "Inactive" label). A new entry shows "Not saved yet" instead.
- **Body:** 12px padding, two columns. Left column: List (dropdown), Priority, Plate (mono), Subject for person lists, Description, Notes. Right column: reference image.
- **Priority** is a **segmented button group**, 30px, three equal segments. The selected segment uses the priority's tint, border and bright text (Critical red, High amber, Medium blue); unselected segments are `--bg-3`.
- **Required fields** carry a red `*` after the label. Errors show under the field in `--red-b`.
- **Reference image:** dropzone with a dashed 1px `--border-strong` border, `--bg-1` fill, 20px `upload` icon, "Choose a file or drag it here" in `--text-2`, "JPEG, PNG or WebP, up to 50 MB" in 11px `--text-3`. Dragging over turns the border and tint blue. With an image, show the image in a bordered card with a "Replace" secondary button.
- **Footer bar** (pinned to the bottom): 1px top border, `--bg-2`, status text on the left in 12px `--text-3` ("Saved 2 minutes ago", errors in `--red-b`, success in `--green-b`), buttons on the right: **Discard** (secondary), **Save changes** (primary, disabled until the form has changes). In create mode: Cancel and Create entry.
- **Delete / deactivate confirmation** uses the dialog from 3.8.
- No-permission state: centered `lock` icon and message in `--text-3`.

### 4.4 Cameras (`CamerasView.tsx`, `AdapterStrip.tsx`, `RegistryTable.tsx`, drawers)

**Layout, top to bottom:** adapter cards, toolbar, registry table (fills the rest and scrolls).

**Adapter cards:** a row of equal cards, 12px padding and gaps, on `--bg-1`. Each card (`--bg-2`, 1px `--border`): adapter name 13px/500 `--text`; the camera count in mono 20px/600 `--text`; "cameras · RTSP" 11px `--text-3`; a **health bar** of one 4px-high segment per camera group (green live, amber degraded, red down, 2px gaps); and a status line with a dot ("all streaming" or "3 needing attention"). A card that needs attention gets an amber border and a 2px amber left bar.

**Toolbar:** 8px/12px padding, `--bg-2`, 1px borders above and below. Left: name filter (26px) and three dropdowns (department, adapter, health), all 26px. Right: **View on map** and **Gap analysis** as secondary buttons with `map-pin` and `scan-search` icons. Because "View on map" changes the page, it's the one navigation that stays a button here: it applies to the whole filtered set, not one row.

**Registry table:** per Part 3 table spec, with columns: expand chevron, Id (mono), Site, District, Department, Adapter (neutral chip), Codec, Resolution, FPS, Bitrate, Health, Last frame, Reconnects 24h, Decode errors, row actions. Wide tables scroll horizontally inside the container, with the first three columns sticky.
- **Health cell:** 8px dot plus label (Live green, Degraded amber, Reconnecting/Down red). A "Last frame" older than a minute shows in `--red-b`.
- **Unprobed codec:** neutral chip "unprobed".
- **Row actions** (right): "Map" as a text link with the `map-pin` icon, and a ghost `pencil` icon button for edit (only with the `onboard_camera` permission). Edit changes data (button); Map goes to another page (link).
- **Expanded row:** `--bg-2` full-width strip with the live preview (200px wide, 16:9, `--bg-0`) on the left and a four-column key-value list on the right (bitrate, reconnects, decode errors, department).
- Preview player: controls are ghost icon buttons over a 60% `--bg-0` bar at the bottom; status chip top-left (Live green, Buffering amber, Error red).

**Edit camera drawer:** drawer spec from 2.8, 420px: camera name and ID in the header, a department dropdown, a footer with Cancel and Save.
**Gap analysis drawer:** 560px, a table of coverage gaps (district, uncovered road, distance to nearest camera) with a "Show on map" link per row.

### 4.5 Detections (`DetectionsView.tsx`, `DetectionsTable.tsx`, `VehiclesTable.tsx`)

**Layout, top to bottom:** KPI strip, filter toolbar, mode row, table.

**KPI strip:** six cells separated by 1px lines (not separate cards), `--bg-2`. Each: value in mono 18px/600 `--text`, label 11px `--text-3` below. A KPI past its threshold (for example corrected-by-OCR over 15%) shows its value in `--amber-b`.

**Filter toolbar:** same style as Cameras: text filter, camera dropdown, time-window dropdown (All, Full day, Last hour, Last 3 hours), then on the right a ghost **Clear filters** (`x` icon) and an **Export report** secondary button (`download` icon).

**Mode row:** a segmented control **Raw reads | Vehicles** (same style as the map mode switch) and a count in 12px `--text-3` ("Showing 50 of 12,408").

**Raw reads table:** columns Time (mono), Plate (mono, `--text`), Camera, District, Flag, actions. Flag is a chip: Stolen red, Wanted amber, Suspect blue, none shows a dimmed dash. Row actions are two **text links** with icons: "Trace" (`route`) and "Map" (`map-pin`), both navigation. Expanding a row shows a `--bg-2` strip with the raw OCR text (mono, `--amber-b`) and the alternate readings with their costs.
**Vehicles table:** Vehicle (plate), Reads, Variants merged (corrected variants in `--amber-b`, "none" dim), Cameras, Districts, First seen, Last seen, Mean confidence (confidence bar from 3.4), Flag, actions (same two links).
**Unresolved plate segments** display as `??` in `--text-3`.
**Live updates:** new rows fade in from `--blue-t` over 600ms; the table never jumps while a row is selected or expanded.

### 4.6 Trace (`TraceView.tsx` and `trace/*`)

**Header strip** (`--bg-2`, bottom border, 10px/12px padding), one row: plate graphic; six summary figures (sightings, path length, elapsed, mean over ground, districts, identity confidence), each a mono 14px/600 `--text` value over an 11px `--text-3` label, 20px apart; then on the right a **Show on map** link (`map-pin`), an **Export history** secondary button (`download`) and **Add to watchlist** as the primary button (`eye`). Export and Add change or produce data, so they are buttons; Show on map is a link. Export is disabled until the plate resolves.

**Body:** two columns, `1fr` and a fixed 320px, 12px padding and gap, the left column scrolls with the page body and the right column stays beside it. All blocks use the card spec (3.7).

**Left column**
- *Sighting evidence, in order:* horizontal strip of 120px evidence tiles (`--bg-1`, 1px `--border`, 2px radius): 62px image on top, plate in mono 11px/500 below, then the time. Corrected reads get an amber border and a small amber "corrected" chip; watchlist-flagged reads a chip in the severity color. The card header's right side has a note in normal-weight 11px `--text-3` ("2 of 6 corrected before matching"). Image click opens the lightbox.
- *Leg analysis:* table with Leg, From, To, Gap, Distance, Implied speed, Verdict. The selected leg row is blue-tinted with the bar; click selects the leg and updates the map and detail card.
- *Candidates the engine rejected:* same table style. Rejected rows are `--text-3`, the read text is struck through, verdict is red.

**Verdict display (used in Trace and Health):** 8px dot plus 12px label: *Accepted* green, *Accepted, long gap* amber, *Rejected* red. Never colored text alone.

**Right column**
- *Map:* 170px tall (fills available height on tall screens), dark tiles, cyan route for the selected leg only, white end marker.
- *Leg detail:* key-value list (from, to, speed, verdict).
- *Where to watch next:* 26px rows: camera name, distance in mono `--text-3`, ETA in mono `--text`.
- *Coverage gaps on this route:* same rows; the label on the right ("no camera") in `--amber-b`.

**States:** loading shows skeleton blocks; no sightings shows a centered `route` icon with "No sightings found for this plate." in `--text-3`.

### 4.7 Health (`HealthView.tsx`, detector instance drawers)

**Header row:** "Detector instances" 14px/600 with a count in 11px `--text-3`, and **Add instance** as the primary button on the right.

**Table:** ID (mono), Name, District, Status, Total cameras and Active cameras (right-aligned mono), Last connected, edit (ghost `pencil`).
- **Status:** dot plus label: Active green, Pending amber, Error red, Disabled `--text-3` gray.
- *Active cameras* lower than *Total* on an Active or Error instance shows in `--red-b`. "Never" in `--text-3`. A stale last-connected time on an Error instance shows `--red-b`.
- Empty state: `server` icon, "No detector instances yet", and a primary Add button.

**Add / Edit drawers:** drawer spec from 2.8 at 420px. Fields: name, district, connection details, status where editable. Footer: Cancel and Save (Add instance in create mode).

### 4.8 Departments (`DepartmentsView.tsx`)

**KPI strip:** six cells as in Detections (4.5). *Nodal officer pending* turns amber when above zero.

**Body:** a table with the remaining width plus a 300px right column.
- **Table columns:** Department, Cameras held, Onboarded, Progress, VMS in use, Retention, Data sharing, Nodal officer. Numbers right-aligned mono.
- **Progress:** 80×4px bar (`--bg-5` track, `--blue-b` fill) followed by the percent in `--text-2`. Zero shows an empty track.
- **VMS:** neutral chip with the vendor; undeclared shows a dimmed "unknown" chip.
- **Data sharing:** Signed green chip, In draft amber chip, Not started neutral chip.
- **Nodal officer:** name in `--text-2`; unassigned shows "Pending" in `--amber-b`.
- **Right column cards:** *What we need from each department*: checklist rows, a green `check` for done and an amber `circle` for outstanding, 12px text, 1px dividers. *Onboarding waves*: key-value rows (wave, rationale, camera count in mono).
- Selecting a department row filters the checklist to that department and shows its name in the card header.
- "Not implemented yet" state (the hook reports it): centered notice with an `info` icon and the message in `--text-2`; no raw error.

### 4.9 Sign-in (`SignIn.tsx`)

The lockup is the hero of this screen, so it sits **above** the card, large, not inside it.

- **Background:** `--bg-0` with one soft blue glow at the top center (`radial-gradient(ellipse at 50% 0%, rgba(45,114,210,.14), transparent 60%)`). Nothing else decorative. The 2px status line is hidden.
- **Brand block** (centered, 28px above the card): the full lockup **GOTHAM │ Sentinel** at **26px**. "GOTHAM" 600 weight, letter-spacing `.22em`, uppercase, `--text`. The divider is 1px `--border-strong` with 16px padding each side. "Sentinel" 400 weight, `--text-2`. No organisation name, no crest, no tagline.
- **Card:** 360px wide, `--bg-2`, 1px `--border`, 4px radius, dialog shadow. It holds only the form, no logo.
  - Body (24px padding): "Sign in" 14px/600 `--text`, then "Authorised personnel only." in 12px `--text-3`.
  - A full-width **primary** button, 34px tall, "Continue with GSWAN single sign-on" with the `key-round` icon.
  - Divider "or use a service account" (11px `--text-3`, hairlines each side).
  - Two fields: service identifier, passphrase.
  - A full-width **secondary** "Sign in" button (SSO is the preferred route, so it takes the primary color).
  - Failed sign-in: message in `--red-b` under the passphrase field plus a red field border. Expired session: message in `--amber-b` above the button.
  - Pending: label becomes "Signing in…", form disabled.
  - Footer strip (top border): the audit notice in 11px `--text-3`.
- On narrow screens the lockup drops to 20px and the card goes full width with 16px side gutters.

### 4.10 Cross-page rules

1. Buttons change data, links go somewhere else (4.2).
2. One primary button per view or dialog.
3. Plates are dashed plain text everywhere; the plate graphic appears only in a detail header (alert, watchlist entry, trace).
4. Severity colors are fixed: critical red, high amber, medium blue.
5. Status is always a dot plus a label. Color alone is never the only signal.
6. Every empty state has an icon, one line of text, and, where the user can act, one primary button.
7. Every table follows 3.4. Wide tables scroll horizontally with the first columns sticky.
