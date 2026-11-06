# template-xr-tour

TypeScript + Vite · Marzipano (tour 360) · three.js (WebXR) · getUserMedia.

```
npm install
npm run dev      # https://<ip>:5173 (cert autoassinado; Quest/celular precisam de HTTPS)
```

## Estrutura
- `public/tour/` — export do Marzipano: `data.json`, `img/`, `tiles/<cena>/…`. Troque pelo seu tour.
  Aqui só `1-terreo_entrada` tem tiles completos; as outras cenas mostram só o `preview.jpg`.
- `src/tour/tour.ts` — viewer Marzipano, cenas, hotspots de link/info.
- `src/tour/gyro.ts` — giroscópio (celular em pé).
- `src/xr/xr.ts` — sessão `immersive-vr` com three.js (cubo do `preview.jpg` + hotspots clicáveis por controle). Carregado sob demanda.
- `src/media/camera.ts` — `startCamera()` / `captureFrame()` (getUserMedia).

## Limites
- VR usa o `preview.jpg` (256px/face), não os tiles multi-resolução.
- Passthrough/câmera dentro da sessão imersiva do Quest não é exposto via getUserMedia.
