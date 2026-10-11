import type { LabeledBBox } from '../common/BBoxImage'
import type { AlertEvidence } from '../../types/domain'

// `bbox` predates the explicit plate/vehicle fields and has always been the plate box.
export function evidenceBoxes(e: AlertEvidence): LabeledBBox[] {
  const plate = e.plate_bbox ?? e.bbox
  const boxes: LabeledBBox[] = []
  if (e.vehicle_bbox) boxes.push({ ...e.vehicle_bbox, className: 'bbox-vehicle' })
  if (plate) boxes.push({ ...plate, className: 'bbox-plate', magnify: true })
  return boxes
}
