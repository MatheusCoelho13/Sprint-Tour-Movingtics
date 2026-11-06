// Marzipano não tem @types: só o que o template usa.
declare module 'marzipano' {
  interface View { yaw(): number; pitch(): number; setYaw(v: number): void; setPitch(v: number): void }
  interface Scene {
    switchTo(): void
    view(): View
    hotspotContainer(): { createHotspot(el: HTMLElement, pos: { yaw: number; pitch: number }): unknown }
  }
  class Viewer {
    constructor(el: HTMLElement)
    createScene(o: { source: unknown; geometry: unknown; view: unknown; pinFirstLevel?: boolean }): Scene
  }
  const Marzipano: {
    Viewer: typeof Viewer
    ImageUrlSource: { fromString(url: string, opts?: { cubeMapPreviewUrl?: string }): unknown }
    CubeGeometry: new (levels: unknown[]) => unknown
    RectilinearView: (new (params: unknown, limiter?: unknown) => View) & {
      limit: { traditional(maxRes: number, maxVFov: number): unknown }
    }
  }
  export default Marzipano
}
