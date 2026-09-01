# `unified-grid-v2.html` — Analysis

A single-file, self-contained HTML mockup (~6,675 lines, no build step, no backend) of a
statewide CCTV/ANPR command-and-control product for the **Gujarat Police**, branded
**"Unified CCTV Grid."** It's a static-data prototype meant to sell/validate a product
concept — every number on screen is generated client-side from hardcoded JS arrays, but it's
wired up to *look and behave* like a live system reading from Postgres/PostGIS.

## What it is

- A dark-themed, IBM Plex Sans/Mono operations console styled after real police command-room
  software (Palantir Gotham-style density: KPIs, tables, maps, timelines, audit trails).
- Uses **Leaflet.js** (via CDN) for real interactive maps centered on Gujarat.
- Gated behind a fake **GSWAN single sign-on** login screen (`#signin`) with a pre-filled
  service account (`op.mharkhani`) and TOTP field, reinforcing the "authorised personnel
  only, every action is audited" framing.
- A fake SQL/DB layer (`const db = (() => {...})()`) wraps every data fetch in a
  `setTimeout`-based promise that also writes a realistic SQL string and a
  "`N rows in M ms`" line into a bottom status bar (`#sql`, `#ms`) — so the mockup *reads*
  like it's hitting `postgres 16 + postgis 3.4` even though it's returning static arrays.

## Structure: seven views behind a left icon rail

| Nav icon | View id | Purpose |
|---|---|---|
| Map | `viewMap` | Statewide map of onboarded cameras (Leaflet), colored by codec/properties-known status, plus an active ANPR trace route and a stop-by-stop timeline for a plate. |
| Alerts | `viewAlerts` | Alert console / triage queue — watchlist-match alerts with evidence crop, matched watchlist record (from `eGujCop`/`VAHAN`), the rule that fired, location, and a full audit trail. Acknowledge / escalate / false-positive actions. |
| Cameras | `viewCams` | Camera & adapter registry — searchable/filterable table of all cameras (district, department, adapter, codec, resolution, fps, bitrate, health, reconnects, decode errors), an "onboard camera" drawer with a live probe simulation, bulk CSV import, gap analysis, and a live-preview player (capped at 4 concurrent streams). |
| Detections | `viewDet` | Raw ANPR plate-read log with fuzzy matching, confidence threshold, per-camera/district/time filters, and a toggle between "raw reads" and "resolved vehicles." |
| Trace | `viewTrace` | Route-trace / movement-history workbench for a single plate: ordered sighting evidence strip, leg-by-leg kinematic analysis (distance ÷ time ⇒ implied speed, gated at 140 km/h to reject impossible jumps), rejected candidate reads, identity-resolution rationale, projected "next cameras to watch," and coverage gaps on the route. |
| Health | `viewHealth` | Grid health/ops dashboard — KPIs (streams connected, frames/sec, capture-to-alert p95 latency, GPU utilization), a bandwidth argument (centralized-ingest Gbps vs. edge-inference Gbps, computed live from fleet size × mean bitrate), a compute-tier table (edge nodes vs. central correlation), and 24h sparkline charts (reconnects, decode errors, plate-read rate) plus a services status list. |
| Departments | `viewDept` | Statewide onboarding tracker across ~26 Gujarat government departments — cameras held (estimated) vs. onboarded, VMS vendor in use, storage location, retention days, data-sharing agreement status, nodal officer, plus a checklist of what's needed per department and onboarding "waves." |

A right-hand sidebar (`.side`) persists across all views with two live-updating feeds: a
plate-detection ticker and a watchlist-match mini-feed, both pushing new synthetic rows on
an interval to simulate real-time ingest.

## Data model (all static JS, top of `<script>`)

- **`CAMS`** — ~30 seeded cameras across districts (Ahmedabad, Junagadh, Rajkot, etc.), each
  with id/name/area/lat/lon, and — for a subset — codec/resolution/fps/bitrate ("properties
  known" vs. "live, not yet probed," which drives map coloring and a "19 cameras unprobed"
  KPI).
- **`ALERTS`** — a handful of seeded watchlist-match alerts (e.g. a "Stolen vehicle" hit
  against `eGujCop`/an active FIR, a "Wanted person" hit cross-referenced with VAHAN vehicle
  registration), each carrying the matched record, the exact rule/SQL condition that fired,
  and a full timestamped audit trail (ingest → rule match → alert raised → dispatch
  notified → acknowledgement).
- **`TRACE`** — the sighting sequence for one demo plate (`GJ 11 AB 4517`) used to drive the
  map route, timeline, and trace workbench.
- **`ADAPTERS` / `CATALOGUE`** — the ingestion methods supported (RTSP direct, ONVIF, VMS
  SDKs for Milestone/Hikvision, HLS relay as a firewall fallback) and a longer wishlist of
  vendor integrations marked "available" but not yet installed (Genetec, Dahua, Axis, CP
  Plus, Matrix SATATYA, Bosch BVMS, ONVIF Profile T).
- **`DEPTS` / `ONBOARDED`** — ~26 Gujarat government departments with estimated camera
  counts (Home/Police ~30,200 down to Science & Technology ~90), current VMS vendor,
  storage location, retention days, and onboarding/agreement status.

## The narrative it's designed to sell

The Health view in particular is an argument, not just a dashboard: it computes and
displays "if every stream were pulled to one centre" (hundreds of Gbps, petabyte storage)
versus the proposed **edge-inference architecture** (cameras/edge nodes run detection
locally, only lightweight metadata/events go upstream, raw video stays on the owning
department's own storage until an operator explicitly requests it). That edge-vs-centralized
bandwidth math is the architectural thesis the whole mockup is built to justify — a
federated model where ~26 departments keep control of their own footage/VMS but feed
detection events into one statewide correlation and alerting layer.

## Technical notes

- Zero dependencies beyond Leaflet (CSS+JS from cdnjs) and Google Fonts (IBM Plex
  Sans/Mono) — everything else, including the SQL-string simulator, sparkline SVGs, and
  camera "live preview" player, is hand-rolled vanilla JS/CSS.
- Entirely client-side and static; there is no real backend, auth, or persistence — it's a
  clickable prototype/demo, not a functioning application.
