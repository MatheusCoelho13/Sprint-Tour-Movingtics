import type { Tour } from './tour'

type IOSOrientation = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> }

let handler: ((e: DeviceOrientationEvent) => void) | null = null

const rad = Math.PI / 180
const DEADBAND = 0.15 * rad // ruído do sensor (headset parado) não mexe a vista
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))

/**
 * Direção para onde o aparelho aponta (eixo -z do device, saída traseira/frente do headset).
 * R = Rz(alpha)·Rx(beta)·Ry(gamma) aplicado a (0,0,-1). Independe de retrato/paisagem
 * (girar a tela só rola a imagem, não muda a direção) e funciona com Quest e celular.
 */
function lookAt(e: DeviceOrientationEvent) {
  const a = e.alpha! * rad, b = e.beta! * rad, g = (e.gamma ?? 0) * rad
  const east = -Math.sin(g) * Math.cos(a) - Math.cos(g) * Math.sin(b) * Math.sin(a)
  const north = -Math.sin(g) * Math.sin(a) + Math.cos(g) * Math.sin(b) * Math.cos(a)
  const up = -Math.cos(g) * Math.cos(b)
  return { yaw: Math.atan2(east, north), pitch: Math.asin(Math.max(-1, Math.min(1, up))) }
}

/** Liga/desliga giroscópio. Retorna o novo estado. Chamar a partir de um clique (iOS exige gesto). */
export async function toggleGyro(tour: Tour): Promise<boolean> {
  if (handler) {
    removeEventListener('deviceorientation', handler)
    handler = null
    return false
  }
  const req = (DeviceOrientationEvent as IOSOrientation).requestPermission
  if (req && (await req.call(DeviceOrientationEvent)) !== 'granted') return false

  // Âncora: a 1ª leitura casa com a direção atual da vista (não "pula" ao ligar).
  let base: { yaw: number; pitch: number; viewYaw: number } | null = null
  let last = { yaw: 0, pitch: 0 }
  handler = (e) => {
    if (e.alpha == null || e.beta == null) return
    const now = lookAt(e)
    const view = tour.view()
    if (!base) {
      base = { ...now, viewYaw: view.yaw() }
      last = now
    } else if (Math.abs(wrap(now.yaw - last.yaw)) < DEADBAND && Math.abs(now.pitch - last.pitch) < DEADBAND) return
    last = now
    view.setYaw(base.viewYaw + wrap(now.yaw - base.yaw))
    view.setPitch(now.pitch)
  }
  addEventListener('deviceorientation', handler)
  return true
}
