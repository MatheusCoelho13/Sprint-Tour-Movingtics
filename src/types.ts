// Formato do data.json exportado pela ferramenta Marzipano.
export interface LinkHotspot { yaw: number; pitch: number; rotation?: number; target: string }
export interface InfoHotspot { yaw: number; pitch: number; title?: string; text?: string }
export interface SceneData {
  id: string
  name: string
  levels: { tileSize: number; size: number; fallbackOnly?: boolean }[]
  faceSize: number
  initialViewParameters: { yaw: number; pitch: number; fov: number }
  linkHotspots: LinkHotspot[]
  infoHotspots: InfoHotspot[]
}
export interface TourData { name: string; scenes: SceneData[] }

export const TOUR_URL = `${import.meta.env.BASE_URL}tour`
