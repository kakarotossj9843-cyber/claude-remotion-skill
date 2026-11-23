import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, theme } from "../theme";

// Transición firma: un chorro de café cae, la pantalla se llena de café con una
// cresta de crema (dos olas con parallax + burbujas) y, justo en el corte, el
// líquido se drena hacia abajo revelando la escena siguiente.
//
// Se monta en una <Sequence> que empieza `rise` frames antes del corte.
// rise = 0  -> sólo drenaje (apertura del video)
// drain = 0 -> sólo llenado (cierre del video, enlaza con la apertura = loop)
export const CoffeePour: React.FC<{ rise: number; drain: number }> = ({ rise, drain }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame - rise; // 0 = momento del corte (pantalla cubierta)

  const TOP = -170; // nivel con la pantalla totalmente cubierta
  const BOTTOM = H + 140; // nivel fuera de cuadro
  let level: number;
  let motion: number; // 0..1..0, intensidad del oleaje
  if (t < 0) {
    const p = interpolate(t, [-rise, 0], [0, 1], { ...clamp, easing: theme.ease.inOut });
    level = interpolate(p, [0, 1], [BOTTOM, TOP]);
    motion = Math.sin(Math.PI * p);
  } else {
    const q = drain === 0 ? 0 : interpolate(t, [0, drain], [0, 1], { ...clamp, easing: theme.ease.inOut });
    level = interpolate(q, [0, 1], [TOP, BOTTOM]);
    motion = Math.sin(Math.PI * q);
  }

  const phase = (frame / fps) * 7;
  const amp = 18 + 46 * motion;
  // Sólo la línea de superficie (para el trazo de crema)
  const surface = (lvl: number, ph: number, a: number) => {
    const step = 30;
    let d = "";
    for (let x = -step; x <= W + step; x += step) {
      const y =
        lvl +
        Math.sin(x * 0.0075 + ph) * a +
        Math.sin(x * 0.019 - ph * 1.3) * a * 0.35;
      d += `${d ? " L" : "M"} ${x} ${y.toFixed(1)}`;
    }
    return d;
  };
  // Cuerpo de líquido: superficie cerrada hacia abajo fuera de cuadro
  const wave = (lvl: number, ph: number, a: number) =>
    `${surface(lvl, ph, a)} L ${W + 30} ${H + 400} L -30 ${H + 400} Z`;

  // La ola trasera va por delante al subir y por detrás al bajar (parallax)
  const backLevel = level - 110;

  // Chorro: cae del borde superior al inicio del llenado y se corta antes del corte
  const streamIn =
    rise > 5 ? interpolate(t, [-rise, -rise + 5], [0, 1], { ...clamp, easing: theme.ease.out }) : 0;
  const streamOut =
    rise > 5 ? interpolate(t, [-rise * 0.45, -2], [0, 1], { ...clamp, easing: theme.ease.in }) : 1;
  const showStream = rise > 0 && t < 0;
  const streamW = 30 + Math.sin(frame * 1.7) * 4;
  const streamTop = streamOut * level;
  const streamBottom = Math.min(level + 20, streamIn * (H + 100));

  // Burbujas de crema que flotan bajo la superficie
  const bubbles = Array.from({ length: 14 }, (_, i) => {
    const bx = (i * 211) % W;
    const depth = 30 + ((i * 53) % 170);
    const by = level + depth + Math.sin(frame / 4 + i) * 6;
    const r = 4 + ((i * 7) % 10);
    return { bx, by, r, o: 0.25 + ((i * 13) % 40) / 100 };
  });

  if (level >= BOTTOM - 1 && !(showStream && streamIn > 0)) return null;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="coffeeBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={theme.colors.coffeeMid} />
            <stop offset="0.35" stopColor={theme.colors.coffee} />
            <stop offset="1" stopColor={theme.colors.bg} />
          </linearGradient>
          <linearGradient id="stream" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={theme.colors.coffee} />
            <stop offset="0.45" stopColor={theme.colors.coffeeMid} />
            <stop offset="0.6" stopColor={theme.colors.crema} />
            <stop offset="1" stopColor={theme.colors.coffee} />
          </linearGradient>
        </defs>
        {showStream && streamBottom > streamTop ? (
          <rect
            x={W / 2 - streamW / 2}
            y={streamTop}
            width={streamW}
            height={streamBottom - streamTop}
            rx={streamW / 2}
            fill="url(#stream)"
          />
        ) : null}
        <path d={wave(backLevel, phase * 0.8 + 1.7, amp * 0.8)} fill={theme.colors.coffeeMid} />
        <path d={wave(level, phase, amp)} fill="url(#coffeeBody)" />
        <path
          d={surface(level, phase, amp)}
          fill="none"
          stroke={theme.colors.crema}
          strokeWidth={18}
          strokeLinejoin="round"
        />
        <path
          d={surface(level - 6, phase, amp)}
          fill="none"
          stroke={theme.colors.cremaLight}
          strokeWidth={4}
          opacity={0.7}
        />
        {bubbles.map((b, i) => (
          <circle key={i} cx={b.bx} cy={b.by} r={b.r} fill={theme.colors.crema} opacity={b.o} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};
