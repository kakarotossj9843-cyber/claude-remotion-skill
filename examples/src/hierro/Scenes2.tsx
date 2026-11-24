import React from "react";
import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { H, clamp } from "./theme3";
import { Ember, Label, Mesh, Words, useExit } from "./Kit";

// ─── 4. NEBULA → a world ─────────────────────────────────────────────────────
export const Nebula: React.FC<{ duration: number }> = ({ duration }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exit = useExit(duration, 10);
  const cx = 1180, cy = 560;
  const t = interpolate(f, [0, duration], [0, 1], { ...clamp, easing: H.ease.inOut });
  const planet = spring({ frame: f - 60, fps, config: H.spring.slow });
  // hero atom falls in on a curve
  const hp = interpolate(f, [0, 150], [0, 1], { ...clamp, easing: H.ease.inOut });
  const ha = Math.PI * 1.05 + hp * Math.PI * 1.4;
  const hr = 560 * (1 - hp) + 4;
  const hx = cx + Math.cos(ha) * hr, hy = cy + Math.sin(ha) * hr * 0.45;
  const absorbed = f > 150;
  const pop = interpolate(f, [150, 175], [0, 1], { ...clamp, easing: H.ease.out });
  return (
    <AbsoluteFill>
      <Mesh a="#5B3A8C" b={H.colors.accent} />
      <AbsoluteFill style={{ ...exit }}>
        <svg width={1920} height={1080} style={{ position: "absolute" }}>
          {Array.from({ length: 420 }).map((_, i) => {
            const depth = random(`z${i}`);
            const r0 = 120 + random(`r${i}`) * 900;
            const a0 = random(`a${i}`) * Math.PI * 2;
            const r = r0 * (1 - 0.6 * t);
            const a = a0 + (f / fps) * (0.9 / Math.sqrt(r / 120)) * 0.35;
            const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.42;
            const col = random(`c${i}`) > 0.82 ? H.colors.accent : random(`c${i}`) > 0.6 ? "#B79BD8" : H.colors.textDim;
            return <circle key={i} cx={x} cy={y} r={0.6 + depth * 2.4} fill={col}
              opacity={(0.2 + depth * 0.6) * (0.75 + 0.25 * Math.sin(f / 10 + i))} />;
          })}
        </svg>
        {/* accretion disk */}
        <div style={{ position: "absolute", left: cx - 520, top: cy - 120, width: 1040, height: 240, borderRadius: "50%",
          opacity: 0.25 + 0.45 * t,
          background: `radial-gradient(ellipse, #E9D8C455 0%, #7A5AA833 40%, transparent 70%)` }} />
        {/* protoplanet */}
        <div style={{ position: "absolute", left: cx - 110, top: cy - 110, width: 220, height: 220, borderRadius: "50%",
          transform: `scale(${planet * (1 + Math.sin(f / 20) * 0.01)})`,
          background: `radial-gradient(circle at 36% 32%, #8E7A6A 0%, #4A3A33 45%, #160F0D 100%)`,
          boxShadow: `inset -20px -26px 50px rgba(0,0,0,0.7), 0 0 ${40 + pop * 50}px rgba(240,138,60,${0.15 + pop * 0.35})` }} />
        {!absorbed && <Ember x={hx} y={hy} r={10} />}
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 120, top: 150, width: 960, ...exit }}>
        <Words text="Vagó a oscuras" delay={12} size={74} style={{ justifyContent: "flex-start" }} />
        <div style={{ height: 8 }} />
        <Words text="hasta que el polvo" delay={30} size={74} color={H.colors.textDim} style={{ justifyContent: "flex-start" }} />
        <div style={{ height: 8 }} />
        <Words text="se convirtió en un mundo." delay={92} size={74} italic style={{ justifyContent: "flex-start" }} />
      </div>
      <div style={{ position: "absolute", left: cx - 200, top: cy + 160, width: 400, display: "flex", justifyContent: "center", ...exit }}>
        <Label delay={110}>Tierra · día 1</Label>
      </div>
    </AbsoluteFill>
  );
};

// ─── 5. EARTH — rock, ocean, leaf ────────────────────────────────────────────
const Glyph: React.FC<{ kind: number; p: number }> = ({ kind, p }) => {
  const L = 600;
  const common = { fill: "none", stroke: H.colors.text, strokeWidth: 4, strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const, strokeDasharray: L, strokeDashoffset: L * (1 - p) };
  return (
    <svg width={220} height={160} viewBox="0 0 220 160">
      {kind === 0 && <path d="M10 140 L80 40 L110 80 L140 30 L210 140 Z M80 40 L95 70 M140 30 L150 60" {...common} />}
      {kind === 1 && <path d="M10 70 Q37 40 64 70 T118 70 T172 70 T226 70 M10 110 Q37 80 64 110 T118 110 T172 110 T226 110" {...common} />}
      {kind === 2 && <path d="M30 140 Q20 40 190 20 Q180 130 30 140 Z M30 140 Q90 90 150 50 M80 105 L72 75 M115 80 L120 55" {...common} />}
    </svg>
  );
};

export const Earth: React.FC<{ duration: number }> = ({ duration }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exit = useExit(duration, 10);
  const beat = Math.round(fps * 2);
  const words = ["Fue roca.", "Fue océano.", "Fue hoja."];
  const sub = ["4.000 millones de años en el manto", "disuelto, viajando entre continentes", "una espinaca, el año pasado"];
  const cols = [480, 960, 1440];
  const active = Math.min(2, Math.floor((f - 6) / beat));
  // ember hops column to column with a spring
  let ex = cols[0];
  for (let i = 1; i < 3; i++) {
    const p = spring({ frame: f - 6 - i * beat + 6, fps, config: H.spring.smooth });
    ex += (cols[i] - cols[i - 1]) * p;
  }
  const ey = 330 - Math.abs(Math.sin(Math.PI * (((ex - cols[0]) / 480) % 1))) * 90 + Math.sin(f / 18) * 4;
  const arc = interpolate(f, [0, duration], [0, -30], { ...clamp, easing: H.ease.inOut });
  const atmo = spring({ frame: f, fps, config: H.spring.slow });
  return (
    <AbsoluteFill>
      <Mesh a={H.colors.accent} b="#3A6B4A" />
      {/* planet horizon */}
      <div style={{ position: "absolute", left: 960 - 2400, top: 960 + arc + (1 - atmo) * 200, width: 4800, height: 4800,
        borderRadius: "50%", background: "radial-gradient(circle at 50% 0%, #1B3A4F 0%, #0B1720 8%, #05080B 20%)",
        boxShadow: `0 -10px 60px ${H.colors.accent}66, 0 -2px 8px ${H.colors.accent}AA` }} />
      <AbsoluteFill style={{ ...exit }}>
        {words.map((w, i) => {
          const start = 6 + i * beat;
          const p = spring({ frame: f - start, fps, config: H.spring.smooth });
          const draw = interpolate(f - start, [0, 26], [0, 1], { ...clamp, easing: H.ease.out });
          const dim = i < active ? 0.38 : 1;
          return (
            <div key={i} style={{ position: "absolute", left: cols[i] - 230, top: 400, width: 460, display: "flex",
              flexDirection: "column", alignItems: "center", opacity: p * dim,
              transform: `translateY(${(1 - p) * 40}px) scale(${0.95 + p * 0.05})` }}>
              <Glyph kind={i} p={draw} />
              <div style={{ height: 30 }} />
              <div style={{ fontFamily: H.fonts.serif, fontSize: 76, color: H.colors.text, letterSpacing: "-0.02em" }}>{w}</div>
              <div style={{ height: 16 }} />
              <Label delay={start + 10} style={{ fontSize: 16, letterSpacing: "0.2em", textAlign: "center" }}>{sub[i]}</Label>
            </div>
          );
        })}
        <Ember x={ex} y={ey} r={11} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── 6. BLOOD — right now, in you ────────────────────────────────────────────
const usePulse = (offset = 0) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const period = (fps * 60) / H.bpm; // 25 frames
  const g = f + offset;
  const k = Math.floor(g / period);
  const ph = g - k * period;
  const surge = interpolate(ph, [0, 12], [0, 1], { ...clamp, easing: H.ease.out });
  const thump = interpolate(ph, [0, 3, 14], [0, 1, 0], { ...clamp, easing: H.ease.out });
  return { period, k, ph, flow: 3.2 * g + 70 * (k + surge), thump };
};

const Cell: React.FC<{ x: number; y: number; w: number; tilt: number; rot: number; blur: number; o: number }> = ({ x, y, w, tilt, rot, blur, o }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - w / 2, width: w, height: w, borderRadius: "50%",
    transform: `rotate(${rot}deg) scaleY(${tilt})`, filter: blur ? `blur(${blur}px)` : undefined, opacity: o,
    background: `radial-gradient(circle, #5E0A12 0%, #7E1219 28%, ${H.colors.cell} 58%, #8E1A22 78%, #4A070D 100%)`,
    boxShadow: "inset 0 -8px 24px rgba(0,0,0,0.4)" }} />
);

const ECG: React.FC<{ offset?: number; opacity?: number; y?: number }> = ({ offset = 0, opacity = 1, y = 975 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const period = (fps * 60) / H.bpm;
  const head = 1560, ppf = 9;
  const shape = (t: number) => {
    const ph = ((t % period) + period) % period;
    if (ph < 1) return -ph * 14;
    if (ph < 2) return -14 + (ph - 1) * 120;
    if (ph < 3) return 106 - (ph - 2) * 160;
    if (ph < 4) return -54 + (ph - 3) * 54;
    if (ph > 8 && ph < 13) return -Math.sin(((ph - 8) / 5) * Math.PI) * 18;
    return 0;
  };
  const pts: string[] = [];
  for (let x = 200; x <= head; x += 3) {
    const t = f + offset - (head - x) / ppf;
    if (t < 0) continue;
    pts.push(`${x},${y + shape(t) * -0.9}`);
  }
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", opacity }}>
      <defs>
        <linearGradient id="ecgfade" x1="0" x2="1">
          <stop offset="0" stopColor={H.colors.accent} stopOpacity={0} />
          <stop offset="1" stopColor={H.colors.accent} stopOpacity={0.9} />
        </linearGradient>
      </defs>
      <polyline points={pts.join(" ")} fill="none" stroke="url(#ecgfade)" strokeWidth={2.6} strokeLinejoin="round" />
      {pts.length > 0 && <circle cx={head} cy={Number(pts[pts.length - 1].split(",")[1])} r={5} fill={H.colors.accent} />}
    </svg>
  );
};

export const Blood: React.FC<{ duration: number }> = ({ duration }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exit = useExit(duration, 10);
  const { flow, thump } = usePulse();
  const enter = spring({ frame: f, fps, config: H.spring.smooth });
  const layers = [
    { n: 16, wMin: 70, wMax: 110, speed: 0.45, blur: 5, o: 0.45 },
    { n: 14, wMin: 140, wMax: 190, speed: 1, blur: 0, o: 0.95 },
    { n: 6, wMin: 320, wMax: 420, speed: 1.9, blur: 16, o: 0.85 },
  ];
  const W = 1920 + 600;
  // hero cell rides the flow at a reduced rate so it stays on screen
  const hx = 380 + flow * 0.48;
  const hy = 560 + Math.sin(f / 26) * 30;
  return (
    <AbsoluteFill>
      <Mesh base={H.colors.bloodDeep} a={H.colors.cell} b={H.colors.blood} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 55%, rgba(170,30,40,${0.18 + thump * 0.14}) 0%, transparent 70%)` }} />
      <AbsoluteFill style={{ opacity: enter, transform: `scale(${1.02 + thump * 0.015})`, ...exit }}>
        {layers.map((L, li) => (
          <React.Fragment key={li}>
            {Array.from({ length: L.n }).map((_, i) => {
              const w = L.wMin + random(`w${li}${i}`) * (L.wMax - L.wMin);
              const x0 = random(`x${li}${i}`) * W;
              const x = ((x0 + flow * L.speed) % W) - 300;
              const y = 120 + random(`y${li}${i}`) * 840 + Math.sin(f / 30 + i) * 10;
              return <Cell key={i} x={x} y={y} w={w} tilt={0.55 + random(`t${li}${i}`) * 0.45}
                rot={random(`r${li}${i}`) * 180 + f * (random(`v${li}${i}`) - 0.5)} blur={L.blur} o={L.o} />;
            })}
          </React.Fragment>
        ))}

                <Cell x={hx} y={hy} w={170} tilt={0.86} rot={14 + f * 0.25} blur={0} o={1} />
                <Ember x={hx} y={hy} r={13} glow={1.4} />
                <div style={{ position: "absolute", left: hx + 100, top: hy - 70, opacity: interpolate(f, [60, 80], [0, 1], clamp) }}>
                  <div style={{ width: 70, height: 1, background: H.colors.textDim, transform: "rotate(-30deg)", transformOrigin: "left", marginLeft: -40, marginTop: 50 }} />
                  <Label delay={64} style={{ color: H.colors.text, fontSize: 18 }}>Fe²⁺ · hemoglobina</Label>
                </div>
      </AbsoluteFill>
      {/* legibility scrim */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(20,3,5,0.85) 0%, rgba(20,3,5,0.35) 30%, transparent 45%, transparent 66%, rgba(12,2,3,0.92) 100%)" }} />
      <div style={{ position: "absolute", top: 90, width: "100%", ...exit }}>
        <Words text="Hoy viaja por tus venas," delay={14} size={80} weight={500} />
        <div style={{ height: 12 }} />
        <Words text="llevando el oxígeno de tu próximo pensamiento." delay={44} size={46} italic color={H.colors.textDim} per={3} />
      </div>
      <div style={{ position: "absolute", top: 830, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", ...exit }}>
        <Words text="Hay 40.000 trillones de átomos de hierro en ti." delay={140} size={40} font={H.fonts.display} weight={500} per={3} />
        <div style={{ height: 8 }} />
        <Words text="Este es uno de ellos." delay={175} size={40} font={H.fonts.display} weight={500} color={H.colors.textDim} per={3} />
      </div>
      <AbsoluteFill style={{ ...exit }}><ECG y={1020} opacity={0.55} /></AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── 7. END — every heartbeat ────────────────────────────────────────────────
export const End: React.FC<{ duration: number; beatOffset: number }> = ({ duration, beatOffset }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { thump } = usePulse(beatOffset);
  const lineExit = useExit(118, 12);
  const title = "HIERRO".split("");
  const fade = interpolate(f, [duration - 24, duration], [1, 0], { ...clamp, easing: H.ease.in });
  const emberY = interpolate(spring({ frame: f - 112, fps, config: H.spring.smooth }), [0, 1], [380, 640]);
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Mesh />
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% ${emberY / 10.8}%, rgba(240,138,60,${0.05 + thump * 0.1}) 0%, transparent 40%)` }} />
      <div style={{ position: "absolute", top: 520, width: "100%", ...lineExit }}>
        <Words text="Cada latido" delay={6} size={86} />
        <div style={{ height: 6 }} />
        <Words text="es una estrella" delay={22} size={86} />
        <div style={{ height: 6 }} />
        <Words text="que todavía no ha terminado de caer." delay={40} size={56} italic color={H.colors.textDim} per={3} />
      </div>
      <Ember x={960} y={emberY} r={16 * (1 + thump * 0.35)} glow={1 + thump} />
      <div style={{ position: "absolute", top: 390, width: "100%", display: "flex", justifyContent: "center", gap: 34 }}>
        {title.map((c, i) => {
          const p = spring({ frame: f - 122 - i * 4, fps, config: H.spring.smooth });
          return <span key={i} style={{ fontFamily: H.fonts.display, fontWeight: 600, fontSize: 168, color: H.colors.text,
            letterSpacing: "0.04em", opacity: p, transform: `translateY(${(1 - p) * 50}px)`, filter: `blur(${(1 - p) * 10}px)`,
            display: "inline-block" }}>{c}</span>;
        })}
      </div>
      <div style={{ position: "absolute", top: 680, width: "100%", display: "flex", justifyContent: "center" }}>
        <Label delay={150}>Biografía de un átomo · 7.000.000.000 años</Label>
      </div>
      <ECG offset={beatOffset} opacity={0.22} y={1000} />
    </AbsoluteFill>
  );
};
