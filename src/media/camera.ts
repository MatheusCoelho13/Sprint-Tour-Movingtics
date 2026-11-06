// getUserMedia — padrão do sensus-ai/apps/frontend-xr (camera.service.ts + image.utils.ts), sem React.
export interface Camera { video: HTMLVideoElement; stop(): void }

export async function startCamera(
  constraints: MediaStreamConstraints = {
    video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  },
): Promise<Camera> {
  // Lança NotAllowedError (permissão negada), NotFoundError (sem câmera) ou TypeError (sem HTTPS).
  const stream = await navigator.mediaDevices.getUserMedia(constraints)
  const video = document.createElement('video')
  video.srcObject = stream
  video.muted = true
  video.playsInline = true
  await video.play()
  return { video, stop: () => stream.getTracks().forEach((t) => t.stop()) }
}

/** Frame atual como data URL JPEG, lado maior limitado a maxSize (mantém aspecto). */
export function captureFrame(video: HTMLVideoElement, maxSize = 1280, quality = 0.8): string {
  const scale = Math.min(1, maxSize / Math.max(video.videoWidth, video.videoHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(video.videoWidth * scale)
  canvas.height = Math.round(video.videoHeight * scale)
  canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', quality)
}
