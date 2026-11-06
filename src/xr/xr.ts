import * as THREE from 'three'
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js'
import { TOUR_URL, type SceneData } from '../types'

// Marzipano preview.jpg = 6 faces empilhadas nesta ordem. Three CubeTexture espera px,nx,py,ny,pz,nz.
// Marzipano: frente = -z, direita = +x (mesma convenção yaw/pitch do app.js antigo).
const STRIP = 'bdflru'
const THREE_ORDER = 'rludbf'
const RADIUS = 6

async function loadCube(url: string): Promise<THREE.CubeTexture> {
  const img = await new THREE.ImageLoader().loadAsync(url)
  const s = img.width
  const faces = [...THREE_ORDER].map((f) => {
    const c = document.createElement('canvas')
    c.width = c.height = s
    c.getContext('2d')!.drawImage(img, 0, STRIP.indexOf(f) * s, s, s, 0, 0, s, s)
    return c
  })
  const tex = new THREE.CubeTexture(faces)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

/** Sessão VR com three.js. Panorama = preview.jpg (baixa-res); tiles em alta continuam só no Marzipano 2D. */
export function initXR(onNavigate: (id: string) => void) {
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.xr.enabled = true
  renderer.xr.setReferenceSpaceType('local') // cabeça = origem, bate com o cubo/hotspots
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 100)
  const hotspots = new THREE.Group()
  scene.add(hotspots)

  const linkMat = new THREE.MeshBasicMaterial({
    map: new THREE.TextureLoader().load(`${TOUR_URL}/img/link.png`, (t) => (t.colorSpace = THREE.SRGBColorSpace)),
    transparent: true,
  })
  const linkGeo = new THREE.PlaneGeometry(0.8, 0.8)
  const cubes = new Map<string, THREE.CubeTexture>()
  let wanted = ''

  const ray = new THREE.Raycaster()
  const m = new THREE.Matrix4()
  for (const i of [0, 1]) {
    const ctrl = renderer.xr.getController(i)
    ctrl.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -RADIUS)])))
    ctrl.addEventListener('select', () => {
      m.identity().extractRotation(ctrl.matrixWorld)
      ray.ray.origin.setFromMatrixPosition(ctrl.matrixWorld)
      ray.ray.direction.set(0, 0, -1).applyMatrix4(m)
      const hit = ray.intersectObjects(hotspots.children)[0]
      if (hit) onNavigate(hit.object.userData.target)
    })
    scene.add(ctrl)
  }

  document.body.append(VRButton.createButton(renderer))
  renderer.setAnimationLoop(() => renderer.render(scene, camera))

  return {
    async setScene(s: SceneData) {
      wanted = s.id
      hotspots.clear()
      for (const h of s.linkHotspots) {
        const mesh = new THREE.Mesh(linkGeo, linkMat)
        mesh.position.set(
          RADIUS * Math.sin(h.yaw) * Math.cos(h.pitch),
          RADIUS * Math.sin(h.pitch),
          -RADIUS * Math.cos(h.yaw) * Math.cos(h.pitch),
        )
        mesh.lookAt(0, 0, 0)
        mesh.userData.target = h.target
        hotspots.add(mesh)
      }
      let tex = cubes.get(s.id)
      if (!tex) cubes.set(s.id, (tex = await loadCube(`${TOUR_URL}/tiles/${s.id}/preview.jpg`)))
      if (wanted === s.id) scene.background = tex // ignora resposta atrasada de cena já trocada
    },
  }
}
