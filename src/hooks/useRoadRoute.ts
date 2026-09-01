import { useQuery } from '@tanstack/react-query'
import { fetchRoadRoute } from '../lib/routing'

// A route between the same ordered set of points never changes, so cache it
// forever once fetched. retry:1 — this hits a public demo server, no point
// hammering it if it's down; callers fall back to a straight line.
export function useRoadRoute(points: [number, number][]) {
  return useQuery({
    queryKey: ['roadRoute', points],
    queryFn: () => fetchRoadRoute(points),
    enabled: points.length >= 2,
    retry: 1,
    staleTime: Infinity,
  })
}
