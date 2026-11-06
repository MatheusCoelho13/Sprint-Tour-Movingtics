import type { Tour } from './tour'

type IOSOrientation = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> }

let handler: ((e: DeviceOrientationEvent) => void) | null = null

/** Liga/desliga giroscópio. Retorna o novo estado. Chamar a partir de um clique (iOS exige gesto). */
export async function toggleGyro(tour: Tour): Promise<boolean> {
  if (handler) {
    removeEventListener('deviceorientation', handler)
    handler = null
    return false
  }
  const req = (DeviceOrientationEvent as IOSOrientation).requestPermission
  if (req && (await req.call(DeviceOrientationEvent)) !== 'granted') return false

  // ponytail: assume celular em pé (retrato). Paisagem pede compensar screen.orientation.
  let alpha0: number | null = null
  handler = (e) => {
    if (e.alpha == null || e.beta == null) return
    alpha0 ??= e.alpha
    const view = tour.view()
    view.setYaw(((alpha0 - e.alpha) * Math.PI) / 180) // alpha cresce girando p/ esquerda
    view.setPitch(((e.beta - 90) * Math.PI) / 180) // beta=90 => celular em pé
  }
  addEventListener('deviceorientation', handler)
  return true
}
