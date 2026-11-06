import './style.css'
import { createTour } from './tour/tour'
import { toggleGyro } from './tour/gyro'
import { startCamera, type Camera } from './media/camera'
import { TOUR_URL, type TourData } from './types'

const data: TourData = await (await fetch(`${TOUR_URL}/data.json`)).json()
const tour = createTour(document.getElementById('pano')!, data)
const ui = document.getElementById('ui')!

const addButton = (label: string, onClick: (b: HTMLButtonElement) => void) => {
  const b = Object.assign(document.createElement('button'), { textContent: label })
  b.addEventListener('click', () => onClick(b))
  ui.append(b)
}

// WebXR (three só é baixado se o aparelho suporta VR imersivo)
if (await navigator.xr?.isSessionSupported('immersive-vr').catch(() => false)) {
  const { initXR } = await import('./xr/xr')
  const xr = initXR(tour.goTo)
  tour.onChange((s) => void xr.setScene(s))
  void xr.setScene(tour.scene)
}

// Giroscópio (celular)
if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
  addButton('📱 Giroscópio', async (b) => b.classList.toggle('on', await toggleGyro(tour)))
}

// Câmera (getUserMedia) — exemplo: preview. Troque pelo seu uso (ex.: captureFrame → API).
let cam: Camera | null = null
addButton('📷 Câmera', async (b) => {
  if (cam) {
    cam.stop()
    cam.video.remove()
    cam = null
    return b.classList.remove('on')
  }
  try {
    cam = await startCamera()
    cam.video.id = 'cam'
    document.body.append(cam.video)
    b.classList.add('on')
  } catch (err) {
    console.error('[CAMERA]', err)
    b.textContent = err instanceof DOMException && err.name === 'NotAllowedError' ? '📷 Permissão negada' : '📷 Erro na câmera'
  }
})
