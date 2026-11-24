import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { H, clamp } from "./theme3";

// Layer 1 — drifting mesh, tinted per scene
export const Mesh: React.FC<{ a?: string; b?: string; base?: string }> = ({
  a = H.colors.hero,
  b = H.colors.accent,
  base = H.colors.bg,
}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: base }}>
      <div style={{ position: "absolute", width: 1500, height: 1500, borderRadius: "50%", top: -700,
        left: -500 + Math.sin(f / 60) * 60,
        background: `radial-gradient(circle, ${a}22, transparent 62%)` }} />
      <div style={{ position: "absolute", width: 1200, height: 1200, borderRadius: "50%", bottom: -650,
        right: -400 - Math.cos(f / 75) * 50,
        background: `radial-gradient(circle, ${b}18, transparent 65%)` }} />
    </AbsoluteFill>
  );
};

// Layer 4 — grade
export const Grade: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ backgroundColor: H.colors.hero, mixBlendMode: "soft-light", opacity: 0.16 }} />
    <AbsoluteFill style={{ background:
      "linear-gradient(180deg, rgba(0,0,0,0.25), transparent 25%, transparent 70%, rgba(0,0,0,0.35))" }} />
  </AbsoluteFill>
);

// Layer 5 — grain + vignette
export const Grain: React.FC = () => {
  const f = useCurrentFrame();
  const noise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;
  return <AbsoluteFill style={{ pointerEvents: "none", backgroundImage: noise, backgroundSize: "220px",
    backgroundPosition: `${(f * 7) % 220}px ${(f * 13) % 220}px`, opacity: 0.07, mixBlendMode: "overlay" }} />;
};
export const Vignette: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none",
    background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)" }} />
);

// Word-by-word reveal: fade + rise + de-blur, staggered
export const Words: React.FC<{
  text: string; delay?: number; per?: number; size?: number; color?: string;
  font?: string; weight?: number; italic?: boolean; hero?: string; style?: React.CSSProperties;
}> = ({ text, delay = 0, per = 4, size = 72, color = H.colors.text, font = H.fonts.serif,
  weight = 400, italic = false, hero, style }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: size * 0.26,
      fontFamily: font, fontSize: size, fontWeight: weight, fontStyle: italic ? "italic" : "normal",
      lineHeight: 1.12, letterSpacing: "-0.02em", color, ...style }}>
      {text.split(" ").map((w, i) => {
        const p = spring({ frame: f - delay - i * per, fps, config: H.spring.smooth });
        const isHero = hero && w.replace(/[.,]/g, "") === hero;
        return (
          <span key={i} style={{ display: "inline-block", opacity: p,
            transform: `translateY(${interpolate(p, [0, 1], [34, 0])}px) scale(${interpolate(p, [0, 1], [0.96, 1])})`,
            filter: `blur(${interpolate(p, [0, 1], [8, 0])}px)`,
            color: isHero ? H.colors.hero : undefined,
            textShadow: isHero ? `0 0 40px ${H.colors.heroGlow}` : undefined }}>{w}</span>
        );
      })}
    </div>
  );
};

// Scene wrapper exit: faster than entrances (~10f)
export const useExit = (duration: number, len = 10) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [duration - len, duration], [0, 1], { ...clamp, easing: H.ease.in });
  return { opacity: 1 - p, transform: `translateY(${-30 * p}px)`, filter: `blur(${p * 6}px)` };
};

// The hero atom: an ember point with halo. Used across scenes for continuity.
export const Ember: React.FC<{ x: number; y: number; r?: number; glow?: number }> = ({ x, y, r = 9, glow = 1 }) => {
  const f = useCurrentFrame();
  const b = 1 + Math.sin(f / 9) * 0.12;
  return (
    <div style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%",
      background: `radial-gradient(circle, #FFF3E0 0%, ${H.colors.hero} 55%, ${H.colors.hero}00 100%)`,
      transform: `scale(${b})`,
      boxShadow: `0 0 ${30 * glow}px ${H.colors.heroGlow}, 0 0 ${90 * glow}px rgba(240,138,60,0.28)` }} />
  );
};

// Mono label with tracking
export const Label: React.FC<{ children: React.ReactNode; delay?: number; style?: React.CSSProperties }> = ({ children, delay = 0, style }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - delay, fps, config: H.spring.snappy });
  return (
    <div style={{ fontFamily: H.fonts.mono, fontSize: 20, letterSpacing: "0.32em", textTransform: "uppercase",
      color: H.colors.textDim, opacity: p, transform: `translateY(${(1 - p) * 14}px)`, ...style }}>{children}</div>
  );
};
