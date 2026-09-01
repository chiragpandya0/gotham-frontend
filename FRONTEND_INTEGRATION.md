# Frontend integration — how to talk to this backend

This describes the backend **as actually implemented today**, not the full aspirational
system in `SCHEMA.md`/`API.md`. Those two files are the long-term spec; this file is the
grounded contract for whoever builds the console next (human or AI), covering exactly
what exists, what's stubbed, and what will break if assumed to work.

Backend source: `app/`. Run it with `uv run uvicorn app.main:app --host 0.0.0.0 --port 8000`.
Interactive docs at `/docs` (Swagger) and `/redoc`. Health check at `/healthz`.

---

## 1. The response envelope

Every endpoint returns one of two shapes. There is no third shape, and no endpoint
returns a bare array or bare object.

**Success:**
```json
{
  "data": { /* endpoint-specific */ },
  "meta": {
    "query": "the real SQL statement that ran, params substituted for display",
    "rows": 5,
    "ms": 8,
    "generated_at": "2026-09-10T16:12:04+05:30"
  }
}
```

**Error:**
```json
{
  "error": {
    "code": "not_found",
    "message": "Camera not found",
    "detail": null,
    "retryable": false
  }
}
```

Status codes in use: `400` bad params, `401` no/expired session, `403` missing
permission, `404` unknown or out-of-scope resource, `409` conflicting state change
(alert actions), `422` validation failure, `500` unhandled server error. `503` is
reserved (probe timeouts) but not yet triggered by anything built.

A frontend should treat `error.code` as the stable machine-readable value to switch on
(`"unauthorized"`, `"forbidden"`, `"conflict"`, `"validation_failed"`, `"bad_request"`,
`"not_found"`) and `error.message` as the human-readable string to display. `error.retryable`
is currently always `false` except on the reserved `503` path — not yet meaningful to act on.

`meta.query` is genuinely the SQL that ran (see `app/envelope.py`) — useful for a debug
panel, not something to parse for data.

---

## 2. Auth: session cookie, not a bearer token

`POST /api/auth/login` — body `{"username": "...", "password": "..."}`.

**Two fields exist in the body but do nothing yet: `totp` and `sso`.**
- `totp` is accepted and silently ignored — no second-factor check happens in this build.
- `sso` is checked: if truthy, the request is rejected with a 400
  (`"SSO login not available"`). **Do not send this field unless actually doing SSO** —
  omit it entirely, or send `null`. (This bit a human tester: Swagger UI's "Try it out"
  autofills every optional string field with the literal placeholder `"string"`, which is
  truthy, which trips the SSO rejection. If wiring up a frontend fetch/axios client, this
  isn't a risk — it only comes up when hand-testing through Swagger and forgetting to
  clear the field.)

On success, the response is the *same shape* as `GET /api/me` (see below) plus the
server sets a `Set-Cookie: grid_session=<opaque token>` header — `httpOnly`, `SameSite=Lax`,
8-hour `Max-Age`.

**This is not a token the frontend reads or attaches manually.** It's `httpOnly`, so
JavaScript cannot see its value at all. The browser stores it and attaches it
automatically to every subsequent same-origin request. Concretely:

- Using `fetch`: same-origin requests already include cookies by default. If the
  frontend is served from a **different origin/port** than this API (e.g. a Vite/React
  dev server on `:5173` talking to the API on `:8000`), you must add
  `credentials: "include"` to every fetch call, or the cookie will silently not be sent.
- **CORS is not configured on this backend yet.** There is no `CORSMiddleware` in
  `app/main.py`. A cross-origin frontend dev server will get CORS errors until that's
  added (allowed origin + `allow_credentials=True`). This is a known gap for whoever
  wires up the frontend next — needs `from fastapi.middleware.cors import CORSMiddleware`
  added to `app/main.py`, not present today.
- `POST /api/auth/logout` (204, no body) clears the cookie server-side (deletes the
  Redis session) and tells the browser to drop it.

Nothing about role, permissions, or scope lives in the cookie — only an opaque session
token, resolved server-side against Redis on every request, which then re-reads the
user's *current* row from Postgres. A permission revoked mid-session takes effect on the
user's very next request, not after re-login.

### Demo accounts (all seeded, same password)

| username | password | role | scope |
|---|---|---|---|
| `op.mharkhani` | `GridDemo2026!` | district_supervisor | Junagadh, Rajkot, Gir Somnath |
| `op.rchauhan` | `GridDemo2026!` | operator | Gandhinagar |
| `op.dpatel` | `GridDemo2026!` | operator | Navsari |
| `adm.state` | `GridDemo2026!` | admin | statewide (empty scope array = no restriction) |

---

## 3. `GET /api/me` — read this once on load, drive the whole UI from it

```json
{
  "data": {
    "id": 1, "username": "op.mharkhani", "display_name": "Milan Harkhani", "initials": "MH",
    "role": "district_supervisor", "role_label": "District supervisor",
    "control_room": "Rajkot control room B",
    "permissions": {
      "granted": ["view_live", "trace", "acknowledge", "export"],
      "denied": ["manage_watchlist", "onboard_camera", "ptz_control", "delete_evidence"]
    },
    "scope": {
      "districts": ["Junagadh", "Rajkot", "Gir Somnath"],
      "departments": ["Home, Police", "Transport and RTO"],
      "camera_count": 5,
      "summary": "3 districts, 5 cameras"
    },
    "session": {
      "signed_in_at": "...", "signed_in_str": "01 Sep 2026, 16:39",
      "expires_at": "...",
      "second_factor": "not verified (stub)",
      "source_ip": "127.0.0.1", "network": "GSWAN"
    }
  },
  "meta": {...}
}
```

**Gate UI elements off `permissions.granted`, never hardcode role checks.** e.g. only
show the "Onboard camera" button if `"onboard_camera"` is in `granted`. This is the same
principle the alert detail endpoint uses server-side (`available_actions`, see below) —
the backend is the single source of truth for what a user may do, the frontend just
renders what it's told.

`session.second_factor` always reads `"not verified (stub)"` — don't build UI that implies
2FA actually happened.

A 401 from any endpoint (expired/missing session) means: clear local user state, redirect
to login. Every protected route depends on the `grid_session` cookie, so there's no
separate "refresh token" flow to build.

---

## 4. Scope: enforced server-side, invisible to the frontend

Every endpoint that touches cameras or plate sightings silently filters by the logged-in
user's `scope.districts` — a district-scoped user's `GET /api/cameras` only ever returns
cameras in their districts; a camera outside scope returns `404` from
`GET /api/cameras/{id}`, not `403` (the backend deliberately doesn't confirm the
existence of things a user can't see).

**The frontend does not need to — and must not — apply its own district filtering.**
There's no "all cameras" endpoint that then gets filtered client-side; what comes back
*is* the filtered set already. Don't build a client-side scope check as a security
boundary; it isn't one and doesn't need to be, because the server already did it.

---

## 5. What's actually built vs. not (as of this session)

### Built and verified end-to-end

| Group | Endpoints |
|---|---|
| Identity | `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/me` |
| Cameras | `GET /api/cameras` (+`?geo=true`), `GET /api/cameras/{id}`, `POST /api/cameras/probe` (SSE), `POST /api/cameras`, `GET /api/coverage/gaps` |
| Detections | `GET /api/detections` (+fuzzy search, +`since=`), `GET /api/detections/vehicles`, `GET /api/detections/export` (CSV) |
| Trace | `GET /api/trace/{plate}`, `GET /api/trace/{plate}/export` (CSV) |
| Alerts | `GET /api/alerts` (+`since=`), `GET /api/alerts/{id}`, `POST /api/alerts/{id}/acknowledge`, `POST /api/alerts/{id}/dispatch`, `POST /api/alerts/{id}/false-positive` |

### Not built yet

- `GET /api/stream` (SSE live channel) — planned to ship as a stub only (opens, sends one
  heartbeat, closes) once built, forcing the polling fallback below to engage. Not
  implemented at all yet as of this session.
- `GET /api/health/overview`, `GET /api/health/series`, `GET /api/departments` — next in
  the build order.
- `POST /api/cameras/bulk` — explicitly deferred, not part of the current build order.

**Practical consequence for a frontend built now: there is no live-push channel at all
yet.** Use the polling pattern below for anything that needs to feel live.

### Polling fallback (works today, use this for "live" views)

`GET /api/detections?since={last_seen_id}` and `GET /api/alerts?since={last_seen_id}`
both accept an `id` cursor and return only rows newer than it, with no KPI block (cheap,
meant to be called every few seconds). This is the *only* live-update mechanism that
currently exists — build against this, not against `/api/stream`, until that lands.

---

## 6. Pagination on `/api/detections` and `/api/detections/vehicles`

Keyset, not offset. The list response includes `next_cursor` (an opaque base64 string, or
`null` on the last page). Pass it back as `?cursor=...` to get the next page. There is no
`?page=2` — don't build page-number UI against these two endpoints; build "load more" /
infinite-scroll instead.

---

## 7. Fields that are pre-formatted — do not reformat them

Per the backend's own design principle, every string the UI displays is already
server-formatted: `seen_time_str`, `raised_time_str`, `path_km_str`, `elapsed_str`,
`plate_raw_display`, `state_label`, `priority_label`, `role_label`, `districts_label`,
`coordinates_str`, etc. Times also always come as a matching pair — a raw ISO 8601 field
(`seen_at`) for logic/sorting, and a pre-formatted string (`seen_time_str`) for display.
**Render the `_str`/`_label`/`_display` field, never the raw field, in UI copy.** The one
computation the frontend is expected to do itself is multiplying a sighting's normalised
`bbox` (0–1 range) by the rendered frame's pixel size to draw a box overlay.

---

## 8. Known rough edges to expect while testing

- **Seed data is dated in the future relative to the real clock** (fixtures use
  September 2026 timestamps; wall-clock "now" during this build was September 1, 2026).
  Any "time ago" style field (e.g. an alert's watchlist sync note) computed against a
  future-dated seed timestamp will show as effectively zero, not a sensible past duration.
  Not a bug — just a fixture artifact worth not being confused by.
- Only 8 `plate_sighting` rows and 3 `vehicle_track` rows exist in total (see
  `scripts/seed_db.py`) — most vehicles in `GET /api/detections/vehicles` will show
  `read_count: 1`. The one fully fleshed-out demo path is plate `GJ11AB4517` /
  `GJ 11 AB 4517` (track id `4188`) — 5 sightings across 5 cameras, use this one for any
  demo or screenshot of the trace view.
- `POST /api/cameras/probe`'s RTSP steps are a fixed mock sequence (~1 second of canned
  SSE events), not a real probe — treat the returned `codec`/`width`/`height`/etc. as
  fake but structurally correct.
