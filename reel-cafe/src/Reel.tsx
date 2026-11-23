import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useVideoConfig } from "remotion";
import { CoffeePour } from "./components/CoffeePour";
import { BgMesh, Grade, Grain, Vignette } from "./components/Layers";
import { Chapter, ChapterProps } from "./scenes/Chapter";
import { clamp, theme } from "./theme";

type SceneDef = Omit<ChapterProps, "duration"> & { vo: string; voSec: number };

// Guion. Los tiempos internos (chips, sub, cta) están en segundos desde el inicio
// de la escena y sincronizados con la locución.
const SCENES = (fps: number): SceneDef[] => {
  const s = (sec: number) => Math.round(sec * fps);
  return [
    {
      image: "beans.png",
      pan: { from: 1.04, to: 1.14, x: 0, y: -40 },
      kicker: "CAFÉ DE ESPECIALIDAD",
      headline: "No todo el café es igual.",
      heroWord: "igual.",
      headlineSize: 132,
      position: "bottom",
      vo: "vo/1.wav",
      voSec: 1.33,
    },
    {
      image: "origin.png",
      pan: { from: 1.02, to: 1.12, x: 20, y: 30 },
      kicker: "01 · ORIGEN",
      counter: { to: 1800, suffix: "m", delay: s(0.35), thousands: true },
      headline: "Cultivado en altura. Cosechado a mano.",
      underlineWord: "mano.",
      headlineSize: 84,
      position: "top",
      vo: "vo/2.wav",
      voSec: 4.48,
    },
    {
      image: "roast.png",
      pan: { from: 1.04, to: 1.12, x: 0, y: -40 },
      kicker: "02 · TUESTE",
      headline: "Lotes pequeños, carácter grande.",
      heroWord: "carácter",
      headlineSize: 108,
      chips: [
        { label: "Cacao", at: s(3.5) },
        { label: "Caramelo", at: s(4.05) },
        { label: "Frutos rojos", at: s(4.6) },
      ],
      position: "bottom",
      vo: "vo/3.wav",
      voSec: 5.21,
    },
    {
      image: "grind.png",
      pan: { from: 1.03, to: 1.12, x: -30, y: -20 },
      kicker: "03 · MOLIENDA",
      headline: "El aroma no espera.",
      heroWord: "espera.",
      headlineSize: 132,
      sub: { text: "Molido justo antes de preparar.", at: s(1.3) },
      position: "bottom",
      vo: "vo/4.wav",
      voSec: 4.06,
    },
    {
      video: "pour.mp4",
      kicker: "04 · MÉTODO",
      counter: { to: 93, suffix: "°C", delay: s(0.35) },
      headline: "Paciencia en cada gota.",
      underlineWord: "gota.",
      headlineSize: 84,
      position: "top",
      vo: "vo/5.wav",
      voSec: 3.12,
    },
    {
      image: "latte.png",
      pan: { from: 1.06, to: 1.14, x: -20, y: -70 },
      headline: "Cada taza cuenta una historia.",
      underlineWord: "historia.",
      headlineSize: 112,
      sub: { text: "¿Cuál será la tuya?", at: s(2.25) },
      cta: { label: "Pruébalo hoy", at: s(3.9) },
      position: "bottom",
      isLast: true,
      vo: "vo/6.wav",
      voSec: 3.46,
    },
  ];
};

const Sfx: React.FC<{ at: number; src: string; volume?: number }> = ({ at, src, volume = 0.5 }) => (
  <Sequence from={Math.max(0, at)} layout="none">
    <Audio src={staticFile(`sfx/${src}`)} volume={volume} />
  </Sequence>
);

export const Reel: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const beat = (60 / theme.timing.bpm) * fps; // 20 frames
  const scenes = SCENES(fps);
  const lens = theme.timing.sceneBeats.map((b) => Math.round(b * beat));
  const starts = lens.map((_, i) => lens.slice(0, i).reduce((a, b) => a + b, 0));
  const rise = Math.round(theme.timing.pourRise * fps);
  const drain = Math.round(theme.timing.pourDrain * fps);
  const voLead = Math.round(theme.timing.voLead * fps);

  // Ventanas de voz para atenuar la música (ducking)
  const voWindows = scenes.map((sc, i) => [
    starts[i] + voLead,
    starts[i] + voLead + Math.round(sc.voSec * fps),
  ]);
  const musicVolume = (f: number) => {
    const duck = Math.max(
      ...voWindows.map(([a, b]) =>
        Math.min(
          interpolate(f, [a - 6, a], [0, 1], clamp),
          interpolate(f, [b, b + 10], [1, 0], clamp),
        ),
      ),
    );
    return interpolate(duck, [0, 1], [0.6, 0.2]);
  };

  return (
    <AbsoluteFill style={{ background: theme.colors.bg }}>
      {/* Capa 1 — malla de fondo */}
      <BgMesh />

      {/* Capas 2-3 — asset + tipografía por capítulo */}
      {scenes.map((sc, i) => (
        <Sequence key={i} from={starts[i]} durationInFrames={lens[i]}>
          <Chapter {...sc} duration={lens[i]} />
        </Sequence>
      ))}

      {/* Transición firma: vertido de café en cada corte (+ apertura y cierre en loop) */}
      <Sequence from={0} durationInFrames={drain}>
        <CoffeePour rise={0} drain={drain} />
      </Sequence>
      {starts.slice(1).map((c) => (
        <Sequence key={c} from={c - rise} durationInFrames={rise + drain}>
          <CoffeePour rise={rise} drain={drain} />
        </Sequence>
      ))}
      <Sequence from={durationInFrames - rise} durationInFrames={rise}>
        <CoffeePour rise={rise} drain={0} />
      </Sequence>

      {/* Capa 4 — grade; Capa 5 — grano + viñeta */}
      <Grade />
      <Grain />
      <Vignette />

      {/* ---------- Audio ---------- */}
      <Audio src={staticFile("sfx/track.wav")} volume={musicVolume} />
      {scenes.map((sc, i) => (
        <Sequence key={sc.vo} from={starts[i] + voLead} layout="none">
          <Audio src={staticFile(sc.vo)} volume={1} />
        </Sequence>
      ))}
      <Sfx at={0} src="pour.wav" volume={0.25} />
      {starts.slice(1).map((c) => (
        <React.Fragment key={c}>
          <Sfx at={c - rise - 3} src="pour.wav" volume={0.45} />
          <Sfx at={c} src="bass.wav" volume={0.3} />
        </React.Fragment>
      ))}
      <Sfx at={durationInFrames - rise - 3} src="pour.wav" volume={0.45} />
      {/* Ticks del contador (cap. 01 y 04) */}
      {[1, 4].flatMap((i) => {
        const c = scenes[i].counter!;
        return Array.from({ length: 9 }, (_, k) => (
          <Sfx key={`t${i}-${k}`} at={starts[i] + c.delay + k * 3} src="tick.wav" volume={0.12} />
        ));
      })}
      {/* Pops de los chips (cap. 02) */}
      {scenes[2].chips!.map((ch) => (
        <Sfx key={ch.label} at={starts[2] + ch.at - 2} src="pop.wav" volume={0.3} />
      ))}
      <Sfx at={starts[5] + scenes[5].cta!.at - 3} src="shimmer.wav" volume={0.4} />
    </AbsoluteFill>
  );
};
