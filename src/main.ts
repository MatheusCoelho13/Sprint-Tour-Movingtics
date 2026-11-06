import './style.css'
import { createTour } from './tour/tour'
import { toggleGyro } from './tour/gyro'
import { TOUR_URL, type TourData } from './types'

const data: TourData = await (await fetch(`${TOUR_URL}/data.json`)).json()
const tour = createTour(document.getElementById('pano')!, data)
const ui = document.getElementById('ui')!

const addButton = (label: string, onClick: (b: HTMLButtonElement) => void) => {
  const b = Object.assign(document.createElement('button'), { textContent: label })
  b.addEventListener('click', () => onClick(b))
  ui.append(b)
  return b
}

// WebXR (three só é baixado se o aparelho suporta VR imersivo)
if (await navigator.xr?.isSessionSupported('immersive-vr').catch(() => false)) {
  const { initXR } = await import('./xr/xr')
  const xr = initXR(tour.goTo)
  tour.onChange((s) => void xr.setScene(s))
  void xr.setScene(tour.scene)
}

// Giroscópio (celular/Quest): roda junto com o arrastar; o botão serve p/ desligar/religar.
if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
  const btn = addButton('📱 Giroscópio', async (b) => b.classList.toggle('on', await toggleGyro(tour)))
  // Quest/Android não pedem permissão: liga já na abertura. Só iOS espera o 1º toque.
  if ('requestPermission' in DeviceOrientationEvent) {
    addEventListener('click', (e) => { if (!(e.target as Element).closest('#ui')) btn.click() }, { once: true })
  } else btn.click()
}
