import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { H, clamp } from "./theme3";
import { Grade, Grain, Vignette } from "./Kit";
import { Hook, Nova, Star } from "./Scenes1";
import { Blood, Earth, End, Nebula } from "./Scenes2";

const S = H.scenes;
export const HIERRO_TOTAL_S = Object.values(S).reduce((a, b) => a + b, 0);

// Persistent clock: years before now, eased on a log scale between keyframes.
const KEYS: [number, number][] = [
  [0, 7.0e9], [15, 7.0e9], [16.5, 4.6e9], [21.2, 4.6e9], [23.2, 3.9e9], [26.3, 1], [27, 0],
];
const fmt = (v: number) => Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

const Clock: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  let v = 0;
  for (let i = 0; i < KEYS.length - 1; i++) {
    const [t0, v0] = KEYS[i], [t1, v1] = KEYS[i + 1];
    if (t >= t0 && t <= t1) {
      const p = interpolate(t, [t0, t1], [0, 1], { ...clamp, easing: H.ease.inOut });
      const l0 = Math.log10(v0 + 1), l1 = Math.log10(v1 + 1);
      v = Math.pow(10, l0 + (l1 - l0) * p) - 1;
    }
  }
  const endT = HIERRO_TOTAL_S - S.end;
  const o = interpolate(t, [0.6, 1.2, endT - 0.4, endT], [0, 1, 1, 0], { ...clamp, easing: H.ease.out });
  const now = t >= 26.3;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: o }}>
      <div style={{ position: "absolute", left: 80, top: 58, fontFamily: H.fonts.mono, fontSize: 20,
        letterSpacing: "0.28em", color: H.colors.textDim }}>
        {now ? "AHORA" : <>HACE <span style={{ color: H.colors.text, fontVariantNumeric: "tabular-nums" }}>{fmt(v)}</span> AÑOS</>}
      </div>
      <div style={{ position: "absolute", right: 80, top: 58, fontFamily: H.fonts.mono, fontSize: 20,
        letterSpacing: "0.28em", color: H.colors.textDim }}>
        FE-56 · 1 ÁTOMO
      </div>
    </AbsoluteFill>
  );
};

export const Hierro: React.FC = () => {
  const { fps } = useVideoConfig();
  const order = ["hook", "star", "nova", "nebula", "earth", "blood", "end"] as const;
  let acc = 0;
  const seq = order.map((k) => {
    const from = acc;
    const d = Math.round(S[k] * fps);
    acc += d;
    return { k, from, d };
  });
  const bloodStart = seq[5].from;
  const endStart = seq[6].from;
  const comps: Record<string, React.FC<{ duration: number }>> = { hook: Hook, star: Star, nova: Nova, nebula: Nebula, earth: Earth, blood: Blood };
  return (
    <AbsoluteFill style={{ background: H.colors.bg }}>
      {seq.map(({ k, from, d }) => {
        if (k === "end") {
          return <Sequence key={k} from={from} durationInFrames={d}><End duration={d} beatOffset={endStart - bloodStart} /></Sequence>;
        }
        const C = comps[k];
        return <Sequence key={k} from={from} durationInFrames={d}><C duration={d} /></Sequence>;
      })}
      <Clock />
      <Grade />
      <Grain />
      <Vignette />
      <Audio src={staticFile("sfx/hierro.wav")} />
    </AbsoluteFill>
  );
};
