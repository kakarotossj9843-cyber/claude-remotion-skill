import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useVideoConfig } from "remotion";
import { BgMesh, Grade, Grain, Vignette } from "./components/Layers";
import { Brew } from "./scenes/Brew";
import { Cup } from "./scenes/Cup";
import { Hook } from "./scenes/Hook";
import { theme } from "./theme";

const Sfx: React.FC<{ at: number; src: string; volume?: number }> = ({ at, src, volume = 0.5 }) => (
  <Sequence from={Math.max(0, at)} layout="none">
    <Audio src={staticFile(`sfx/${src}`)} volume={volume} />
  </Sequence>
);

export const Reel: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const scene = Math.round(theme.timing.scene * fps); // 100 frames = 5 beats a 90 BPM
  const ov = Math.round(theme.timing.overlap * fps); // solape para la transición
  const cut1 = scene;
  const cut2 = scene * 2;
  const f = (s: number) => Math.round(s * fps);

  return (
    <AbsoluteFill style={{ background: theme.colors.bg }}>
      {/* Capa 1 — malla de fondo */}
      <BgMesh />

      {/* Capas 2-3 — assets + tipografía por escena */}
      <Sequence from={0} durationInFrames={cut1 + ov}>
        <Hook duration={cut1 + ov} />
      </Sequence>
      <Sequence from={cut1} durationInFrames={scene + ov}>
        <Brew duration={scene + ov} />
      </Sequence>
      <Sequence from={cut2} durationInFrames={durationInFrames - cut2}>
        <Cup duration={durationInFrames - cut2} />
      </Sequence>

      {/* Capa 4 — grade; Capa 5 — grano + viñeta */}
      <Grade />
      <Grain />
      <Vignette />

      {/* Audio: bed + SFX 2-3 frames antes de cada golpe visual */}
      <Audio
        src={staticFile("sfx/track.wav")}
        volume={(fr) => interpolate(fr, [0, durationInFrames], [0.6, 0.55])}
      />
      <Sfx at={f(0.3) - 3} src="whoosh.wav" volume={0.35} />
      <Sfx at={cut1 - f(0.7)} src="riser.wav" volume={0.3} />
      <Sfx at={cut1} src="bass.wav" volume={0.55} />
      <Sfx at={cut1 + f(0.25) - 2} src="whoosh.wav" volume={0.3} />
      <Sfx at={cut1 + f(1.0)} src="pop.wav" volume={0.35} />
      <Sfx at={cut2 - f(0.7)} src="riser.wav" volume={0.3} />
      <Sfx at={cut2} src="bass.wav" volume={0.55} />
      <Sfx at={cut2 + f(1.2) - 3} src="shimmer.wav" volume={0.4} />
    </AbsoluteFill>
  );
};
