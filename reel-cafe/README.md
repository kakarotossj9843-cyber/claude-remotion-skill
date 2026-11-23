# Reel · Café de especialidad (30 s, 1080×1920)

Construido con la skill `remotion-motion-graphics`.

- **Guion:** 6 escenas (gancho → origen → tueste → molienda → método → CTA) con locución en español.
- **Transición firma:** "vertido de café" (`src/components/CoffeePour.tsx`): un chorro cae, la pantalla se llena de café con cresta de crema y se drena revelando la escena siguiente. Abre y cierra el video para que el loop sea continuo.
- **Audio:** música original a 90 BPM con ducking bajo la voz, SFX de vertido, ticks, pops y campanas (`scripts/gen-audio.mjs`). Locución en `public/vo/` (TTS neural es-MX).
- **Assets:** imágenes y clip generados con Claude Imagine en `public/`.

```bash
npm install
npm run audio
npm run render -- --browser-executable=/opt/pw-browsers/chromium_headless_shell
```
