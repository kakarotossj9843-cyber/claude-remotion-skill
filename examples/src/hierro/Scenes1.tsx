import React from "react";
import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { H, clamp } from "./theme3";
import { Ember, Label, Mesh, Words, useExit } from "./Kit";

const CX = 960;

// ─── 1. HOOK — a single iron atom ────────────────────────────────────────────
const SHELLS = [
  { n: 2, rx: 70, ry: 26, tilt: 20, speed: 0.09 },
  { n: 8, rx: 140, ry: 48, tilt: -35, speed: -0.05 },
  { n: 14, rx: 220, ry: 70, tilt: 70, speed: 0.032 },
  { n: 2, rx: 300, ry: 96, tilt: -8, speed: -0.022 },
];

export const Hook: React.FC<{ duration: number }> = ({ duration }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exit = useExit(duration, 12);
  const push = interpolate(f, [0, duration], [0.92, 1.06], { ...clamp, easing: H.ease.inOut });
  const cy = 430;
  return (
    <AbsoluteFill>
      <Mesh />
      <AbsoluteFill style={{ ...exit }}>
        <AbsoluteFill style={{ transform: `scale(${push})` }}>
          <svg width={1920} height={1080} style={{ position: "absolute" }}>
            {SHELLS.map((s, si) => {
              const p = spring({ frame: f - 6 - si * 6, fps, config: H.spring.smooth });
              return (
                <g key={si} transform={`translate(${CX} ${cy}) rotate(${s.tilt}) scale(${p})`} opacity={p}>
                  <ellipse rx={s.rx} ry={s.ry} fill="none" stroke={H.colors.text} strokeOpacity={0.16} strokeWidth={1.4} />
                  {Array.from({ length: s.n }).map((_, i) => {
                    const a = f * s.speed + (i / s.n) * Math.PI * 2;
                    return <circle key={i} cx={Math.cos(a) * s.rx} cy={Math.sin(a) * s.ry} r={3.2}
                      fill={H.colors.accent} opacity={0.55 + 0.45 * Math.sin(a)} />;
                  })}
                </g>
              );
            })}
          </svg>
          <Ember x={CX} y={cy} r={14} glow={1.3} />
          <Label delay={22} style={{ position: "absolute", left: CX + 330, top: cy - 12 }}>Fe · 26 protones</Label>
        </AbsoluteFill>
        <div style={{ position: "absolute", top: 735, width: "100%" }}>
          <Words text="Este átomo de hierro" delay={18} size={64} color={H.colors.textDim} />
          <div style={{ height: 14 }} />
          <Words text="tiene 7.000 millones de años." delay={34} size={92} weight={500} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── 2. STAR — forged in a dying star ───────────────────────────────────────
const LAYERS = [
  { r: 0.93, el: "H" }, { r: 0.77, el: "He" }, { r: 0.61, el: "C" },
  { r: 0.46, el: "O" }, { r: 0.31, el: "Si" },
];

export const Star: React.FC<{ duration: number }> = ({ duration }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const R = 330;
  const sx = 1200, sy = 540;
  const born = spring({ frame: f, fps, config: H.spring.slow });
  const breathe = 1 + Math.sin(f / 14) * 0.012;
  // collapse in the last 16 frames: swell then implode
  const swell = interpolate(f, [duration - 40, duration - 14], [1, 1.12], { ...clamp, easing: H.ease.inOut });
  const implode = interpolate(f, [duration - 14, duration], [1, 0.02], { ...clamp, easing: H.ease.in });
  const scale = born * breathe * swell * implode;
  const shake = f > duration - 40 ? (random(`s${f}`) - 0.5) * interpolate(f, [duration - 40, duration], [0, 14], clamp) : 0;
  const textExit = useExit(duration - 20, 10);
  return (
    <AbsoluteFill>
      <Mesh a={H.colors.starEdge} />
      <AbsoluteFill style={{ transform: `translate(${shake}px, ${shake * 0.6}px)` }}>
        {/* corona */}
        <div style={{ position: "absolute", left: sx - R * 1.9, top: sy - R * 1.9, width: R * 3.8, height: R * 3.8,
          borderRadius: "50%", transform: `scale(${scale})`,
          background: `radial-gradient(circle, ${H.colors.starMid}55 20%, ${H.colors.starEdge}22 42%, transparent 62%)` }} />
        {/* photosphere with turbulence */}
        <div style={{ position: "absolute", left: sx - R, top: sy - R, width: R * 2, height: R * 2, borderRadius: "50%",
          overflow: "hidden", transform: `scale(${scale})`,
          background: `radial-gradient(circle at 45% 42%, ${H.colors.starCore} 0%, ${H.colors.starMid} 38%, ${H.colors.starEdge} 78%, #3A0E08 100%)`,
          boxShadow: `0 0 120px ${H.colors.starMid}88` }}>
          <div style={{ position: "absolute", inset: -R * 0.5, opacity: 0.18, mixBlendMode: "multiply",
            transform: `rotate(${f * 0.4}deg)`,
            background: `repeating-conic-gradient(from 0deg, #7A2A10 0deg, transparent 8deg, #7A2A10 19deg)` }} />
          <div style={{ position: "absolute", inset: -R * 0.5, opacity: 0.22, mixBlendMode: "screen",
            transform: `rotate(${-f * 0.27}deg)`,
            background: `repeating-conic-gradient(from 30deg, #FFF0C8 0deg, transparent 11deg, #FFF0C8 23deg)` }} />
          {/* onion shells — the cross-section of fusion */}
          {LAYERS.map((l, i) => {
            const p = spring({ frame: f - 40 - i * 6, fps, config: H.spring.smooth });
            return <div key={i} style={{ position: "absolute", left: R - R * l.r, top: R - R * l.r,
              width: R * l.r * 2, height: R * l.r * 2, borderRadius: "50%", opacity: p * 0.9,
              border: "2px solid rgba(40,10,4,0.55)", transform: `scale(${0.9 + p * 0.1})`,
              background: `rgba(60,14,6,${0.07 + i * 0.03})` }} />;
          })}
        </div>
        {/* element labels on a leader line, outside the sphere */}
        <div style={{ position: "absolute", left: sx, top: sy, transform: `scale(${scale})` }}>
          {[...LAYERS.map((l) => l.el), "Fe"].map((el, i) => {
            const p = spring({ frame: f - 46 - i * 6, fps, config: H.spring.snappy });
            const y = -R * 0.78 + i * 56;
            const isFe = el === "Fe";
            return <div key={el} style={{ position: "absolute", left: R + 40, top: y - 14, opacity: p,
              transform: `translateX(${(1 - p) * 24}px)`, fontFamily: H.fonts.mono, fontSize: isFe ? 26 : 20,
              letterSpacing: "0.2em", color: isFe ? H.colors.hero : H.colors.textDim, whiteSpace: "nowrap" }}>
              — {el}{isFe ? "  ← aquí" : ""}</div>;
          })}
        </div>
        {/* the iron core */}
        <div style={{ position: "absolute", left: sx, top: sy, transform: `scale(${scale})` }}>
          {f > 70 && <Ember x={0} y={0} r={interpolate(f, [70, 100], [0, 26], { ...clamp, easing: H.ease.out })} glow={1.6} />}
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 120, top: 380, width: 700, ...textExit }}>
        <Words text="Nació en el corazón" delay={14} size={70} style={{ justifyContent: "flex-start" }} />
        <div style={{ height: 10 }} />
        <Words text="de una estrella moribunda." delay={28} size={62} italic color={H.colors.textDim}
          style={{ justifyContent: "flex-start" }} />
        <div style={{ height: 34 }} />
        <Label delay={70}>Fusión: H → He → C → O → Si → Fe</Label>
        <div style={{ height: 12 }} />
        <Label delay={84} style={{ color: H.colors.text }}>El hierro es el final. Ahí la estrella muere.</Label>
      </div>
    </AbsoluteFill>
  );
};

// ─── 3. SUPERNOVA ────────────────────────────────────────────────────────────
const NP = 280;
export const Nova: React.FC<{ duration: number }> = ({ duration }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exit = useExit(duration, 10);
  const flash = interpolate(f, [0, 22], [1, 0], { ...clamp, easing: H.ease.out });
  const shakeAmt = interpolate(f, [0, 20], [26, 0], { ...clamp, easing: H.ease.out });
  const sx = (random(`x${f}`) - 0.5) * shakeAmt, sy = (random(`y${f}`) - 0.5) * shakeAmt;
  const cx = CX, cy = 470;
  const prog = (d: number) => interpolate(f - d, [0, 90], [0, 1], { ...clamp, easing: H.ease.out });
  // hero atom path — out of the blast toward lower-left
  const hp = (t: number) => {
    const p = interpolate(t, [4, 70], [0, 1], { ...clamp, easing: H.ease.out });
    return { x: cx - 520 * p + Math.sin(p * 3) * 40, y: cy + 140 * p };
  };
  const drift = interpolate(f, [70, duration], [0, -60], clamp);
  const zoom = interpolate(f, [0, duration], [1.08, 1], { ...clamp, easing: H.ease.out });
  return (
    <AbsoluteFill>
      <Mesh a={H.colors.accent} b={H.colors.starEdge} />
      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px) scale(${zoom})`, ...exit }}>
        {/* remnant glow */}
        <div style={{ position: "absolute", left: cx - 500, top: cy - 500, width: 1000, height: 1000, borderRadius: "50%",
          opacity: interpolate(f, [0, 60], [0.9, 0.35], clamp),
          background: `radial-gradient(circle, #CFE6FF66 0%, ${H.colors.accent}22 35%, transparent 65%)` }} />
        {/* shock rings */}
        {[0, 5, 11].map((d, i) => {
          const p = prog(d);
          return <div key={i} style={{ position: "absolute", left: cx, top: cy, width: 0, height: 0 }}>
            <div style={{ position: "absolute", left: -1100 * p, top: -1100 * p * 0.9, width: 2200 * p, height: 1980 * p,
              borderRadius: "50%", border: `${Math.max(1, 8 * (1 - p))}px solid rgba(207,230,255,${0.7 * (1 - p)})`,
              boxShadow: `0 0 40px rgba(127,184,214,${0.5 * (1 - p)})` }} />
          </div>;
        })}
        {/* ejecta */}
        <svg width={1920} height={1080} style={{ position: "absolute" }}>
          {Array.from({ length: NP }).map((_, i) => {
            const a = random(`a${i}`) * Math.PI * 2;
            const sp = 0.25 + random(`s${i}`) * 0.9;
            const p = prog(random(`d${i}`) * 6);
            const r = sp * 1150 * p;
            const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.85;
            const tail = 40 * sp * (1 - p) + 4;
            const col = random(`c${i}`) > 0.7 ? H.colors.accent : H.colors.text;
            return <line key={i} x1={x} y1={y} x2={x - Math.cos(a) * tail} y2={y - Math.sin(a) * tail * 0.85}
              stroke={col} strokeOpacity={0.25 + random(`o${i}`) * 0.6} strokeWidth={1 + random(`w${i}`) * 2.2}
              strokeLinecap="round" />;
          })}
        </svg>
        {/* hero atom with motion trail */}
        {Array.from({ length: 8 }).map((_, k) => {
          const p = hp(f - k * 1.5);
          return <div key={k} style={{ position: "absolute", left: p.x - 6, top: p.y + drift - 6, width: 12, height: 12,
            borderRadius: "50%", background: H.colors.hero, opacity: (1 - k / 8) * 0.35, filter: "blur(3px)" }} />;
        })}
        <Ember x={hp(f).x} y={hp(f).y + drift} r={11} glow={1.4} />
      </AbsoluteFill>
      <div style={{ position: "absolute", top: 790, width: "100%", ...exit }}>
        <Words text="Y salió disparado." delay={26} size={110} weight={500} />
        <div style={{ height: 22 }} />
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Label delay={48}>Supernova · 10.000 km/s</Label>
        </div>
      </div>
      <AbsoluteFill style={{ background: "#FFF8EE", opacity: flash, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
