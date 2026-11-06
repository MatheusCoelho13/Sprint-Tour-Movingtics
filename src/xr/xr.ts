import * as THREE from 'three'
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js'
import { TOUR_URL, type SceneData } from '../types'

// Three CubeTexture espera px,nx,py,ny,pz,nz, mas o background cúbico espelha o x (flipEnvMap=-1):
// por isso l/r trocam de lugar e u/d giram 180° p/ casar com as faces do Marzipano.
// Resultado: frente = -z, direita = +x (mesma convenção yaw/pitch dos hotspots).
const THREE_ORDER = 'lrudbf'
const RADIUS = 6

const MAX_FACE = 2048 // 6 faces de 2048² ≈ 100 MB de GPU; 4096 estoura memória no Quest
const loader = new THREE.ImageLoader()

const toCube = (faces: HTMLCanvasElement[]) => {
  const tex = new THREE.CubeTexture(faces)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}
const faceCanvas = (size: number) => Object.assign(document.createElement('canvas'), { width: size, height: size })

/** Costura os tiles do nível z (índice em levels[], igual ao Marzipano). */
async function loadLevel(s: SceneData, z: number) {
  const { size, tileSize } = s.levels[z]
  const n = Math.ceil(size / tileSize)
  const faces = await Promise.all([...THREE_ORDER].map(async (f) => {
    const c = faceCanvas(size)
    const ctx = c.getContext('2d')!
    if (f === 'u' || f === 'd') ctx.setTransform(-1, 0, 0, -1, size, size) // gira 180°
    await Promise.all(Array.from({ length: n * n }, async (_, i) => {
      const x = i % n, y = Math.floor(i / n)
      ctx.drawImage(await loader.loadAsync(`${TOUR_URL}/tiles/${s.id}/${z}/${f}/${y}/${x}.jpg`), x * tileSize, y * tileSize)
    }))
    return c
  }))
  return toCube(faces)
}

/** Sessão VR com three.js. Cubo costurado dos tiles (até 2048px/face). */
export function initXR(onNavigate: (id: string) => void) {
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.xr.enabled = true
  renderer.xr.setReferenceSpaceType('local') // cabeça = origem, bate com o cubo/hotspots
  // Cena é só um skybox, GPU sobra: render mais denso e sem foveation (borda nítida).
  // ponytail: se travar/aquecer no Quest, baixa p/ 1.2; 1.5 é palpite, calibra no aparelho.
  renderer.xr.setFramebufferScaleFactor(1.5)
  renderer.xr.setFoveation(0)
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
      const hit = cubes.get(s.id)
      if (hit) { scene.background = hit; return }
      scene.background = null // não deixa o panorama da cena anterior sob os hotspots novos
      let sharp = 0
      s.levels.forEach((l, i) => { if (!l.fallbackOnly && l.size <= MAX_FACE) sharp = i })
      // 1º um nível leve (aparece rápido), depois o nítido
      for (const z of new Set([Math.min(1, sharp), sharp])) {
        try {
          const t = await loadLevel(s, z)
          if (z === sharp) cubes.set(s.id, t)
          if (wanted === s.id) scene.background = t // ignora resposta atrasada
        } catch (err) { console.error('[XR] falha ao carregar', s.id, 'nível', z, err) }
      }
    },
  }
}
