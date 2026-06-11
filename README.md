# Physical Water Sandbox

An embeddable Three.js water sandbox built for GitHub Pages and iframe use. The demo presents a transparent laboratory tank, an interactive height-field water surface, WASD camera movement, mouse-driven ripples, and draggable objects with simplified buoyancy.

## Features

- Vite + TypeScript + Three.js app
- Transparent glass tank with shadows, edge highlights, and water volume
- Dynamic water mesh with local impulses, propagation, damping, normals, and height queries
- Mouse click and drag ripples, with stronger Shift + click disturbances
- WASD camera movement, mouse look, wheel zoom, and activation overlay for iframe safety
- Bottom inventory bar with wood ball, metal ball, glass block, yellow buoy, and heavy rock
- Simplified gravity, buoyancy, drag, boundary collision, sink/float behavior, and water impact impulses
- Standalone mode and compact `?embed=1` iframe mode
- `postMessage` hooks for pause, resume, reset, and ready events
- GitHub Actions workflow for GitHub Pages deployment

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## GitHub Pages

The project is configured for the repository path:

```ts
base: './'
```

Relative assets work both on GitHub Pages project URLs and when opening the built file directly:

```txt
https://orandolee.github.io/Physical_water/
```

If you want to open a file directly from disk, build first and then open `dist/index.html`. The root `index.html` is the Vite source entry and should be opened through `npm run dev`.

If deploying to a root domain, Vercel, or Netlify root path, you may change it to:

```ts
base: '/'
```

The included workflow at `.github/workflows/deploy.yml` builds on every push to `main` and publishes `dist` with the official GitHub Pages actions.

## Iframe Embed

Standalone embed:

```html
<div class="demo-frame-wrap">
  <iframe
    src="https://orandolee.github.io/Physical_water/"
    title="Water Sandbox Demo"
    loading="lazy"
    allow="fullscreen"
    allowfullscreen
  ></iframe>
</div>
```

Recommended compact embed:

```html
<div class="demo-frame-wrap">
  <iframe
    src="https://orandolee.github.io/Physical_water/?embed=1"
    title="Water Sandbox Demo"
    loading="lazy"
    allow="fullscreen"
    allowfullscreen
  ></iframe>
</div>
```

Responsive frame CSS:

```css
.demo-frame-wrap {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  aspect-ratio: 16 / 9;
  border-radius: 24px;
  overflow: hidden;
  background: #05070a;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
}

.demo-frame-wrap iframe {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}
```

Immersive frame CSS:

```css
.demo-frame-wrap {
  width: 100%;
  height: min(86vh, 900px);
  border-radius: 28px;
  overflow: hidden;
  background: #05070a;
}

.demo-frame-wrap iframe {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}
```

## Controls

- Click the canvas to activate keyboard and mouse controls
- WASD moves the camera
- Drag empty space or use the right mouse button to rotate the view
- Wheel zooms in and out
- Click or drag on the water to create ripples
- Shift + click makes a stronger disturbance
- Drag objects from the bottom bar into the tank
- ESC releases active controls

## postMessage API

Parent pages can send:

```ts
iframe.contentWindow?.postMessage({ type: 'WATER_SANDBOX_PAUSE' }, '*')
iframe.contentWindow?.postMessage({ type: 'WATER_SANDBOX_RESUME' }, '*')
iframe.contentWindow?.postMessage({ type: 'WATER_SANDBOX_RESET' }, '*')
```

The demo sends this after initialization:

```ts
window.parent?.postMessage({ type: 'WATER_SANDBOX_READY' }, '*')
```

The API is optional and the demo runs normally without a parent page.

## Structure

```txt
src/
  main.ts
  styles.css
  scene/
    SceneApp.ts
    CameraController.ts
    Lighting.ts
    PostProcessing.ts
  water/
    WaterSurface.ts
    WaterMaterial.ts
  objects/
    FloatingObject.ts
    ObjectFactory.ts
    ObjectTypes.ts
  ui/
    ActivationOverlay.ts
    Hud.ts
    InventoryBar.ts
  utils/
    constants.ts
    math.ts
```

## Future Enhancements

- Particle splashes on high-energy impacts
- More detailed underwater refraction
- Extra object shapes and custom materials
- Optional debug panel for water damping, impulse strength, and lighting
- Additional sandbox modes such as colored fluids or wave presets
