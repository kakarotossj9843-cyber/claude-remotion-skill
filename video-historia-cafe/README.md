# Historia del café · video vertical de 60 s (720×1280, 24 fps)

Montaje 100 % Python + FFmpeg (sin Remotion). Render ≈ 30 s.

- `guion.json` — narración en 6 bloques de 10 s (145 palabras).
- `assets/voz.mp3` — locución completa (Artificial Studio, OpenAI TTS, voz "onyx").
- `assets/img1-6.png` — imágenes 9:16 (Artificial Studio, Muse Image).
- `make_video.py` — corta la voz por pausas y coloca cada bloque en su ventana de 10 s,
  anima cada imagen con `zoompan` (easing seno, a 2x para evitar temblor), une con
  fundidos de 0.4 s centrados en cada corte, quema subtítulos karaoke `.ass`
  sincronizados con las pausas reales de la voz y exporta `video_final.mp4` (60.000 s).

```bash
python3 make_video.py
```
